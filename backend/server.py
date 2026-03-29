from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from firebase_admin import credentials, auth, initialize_app
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import qrcode
import io
import base64
from collections import defaultdict
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Firebase Admin SDK from environment variables
firebase_cred_dict = {
    "type": os.environ.get('FIREBASE_TYPE', 'service_account'),
    "project_id": os.environ.get('FIREBASE_PROJECT_ID'),
    "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID'),
    "private_key": os.environ.get('FIREBASE_PRIVATE_KEY'),
    "client_email": os.environ.get('FIREBASE_CLIENT_EMAIL'),
    "client_id": os.environ.get('FIREBASE_CLIENT_ID'),
    "auth_uri": os.environ.get('FIREBASE_AUTH_URI'),
    "token_uri": os.environ.get('FIREBASE_TOKEN_URI'),
    "auth_provider_x509_cert_url": os.environ.get('FIREBASE_AUTH_PROVIDER_CERT_URL'),
    "client_x509_cert_url": os.environ.get('FIREBASE_CLIENT_CERT_URL'),
}
cred = credentials.Certificate(firebase_cred_dict)
initialize_app(cred)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Pydantic Models
class User(BaseModel):
    phone: str
    name: Optional[str] = None
    role: str = "admin"  # admin, staff, viewer
    current_event_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Event(BaseModel):
    name: str
    date: str
    location: str
    code: str = Field(default_factory=lambda: ''.join(random.choices(string.ascii_uppercase + string.digits, k=6)))
    qr_code_data: Optional[str] = None
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GiftEntry(BaseModel):
    event_id: str
    guest_name: str
    mobile: Optional[str] = None
    side: str  # bride or groom
    gift_type: str  # cash or item
    amount: Optional[float] = None
    item_description: Optional[str] = None
    payment_mode: Optional[str] = None  # cash or upi
    notes: Optional[str] = None
    added_by: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Staff(BaseModel):
    user_id: str
    event_id: str
    role: str  # staff or viewer
    added_at: datetime = Field(default_factory=datetime.utcnow)

# Request Models
class SendOTPRequest(BaseModel):
    phone: str

class InstantLoginRequest(BaseModel):
    phone: str
    name: str
    role: str = "admin"  # admin, staff, viewer

class VerifyOTPRequest(BaseModel):
    phone: str
    otp_token: str
    name: Optional[str] = None

class CreateEventRequest(BaseModel):
    name: str
    date: str
    location: str

class UpdateGiftEntryRequest(BaseModel):
    guest_name: Optional[str] = None
    mobile: Optional[str] = None
    side: Optional[str] = None
    gift_type: Optional[str] = None
    amount: Optional[float] = None
    item_description: Optional[str] = None
    payment_mode: Optional[str] = None
    notes: Optional[str] = None

class AddStaffRequest(BaseModel):
    phone: str
    event_id: str
    role: str

# Firebase Auth Middleware
async def get_current_user(token: str) -> dict:
    try:
        decoded_token = auth.verify_id_token(token)
        user = await db.users.find_one({"phone": decoded_token.get("phone_number", "")})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return serialize_doc(user)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/instant-login")
async def instant_login(request: InstantLoginRequest):
    """
    Instant login without OTP verification.
    Perfect for trusted environments like weddings where speed is critical.
    """
    try:
        # Validate phone number format
        if not request.phone or len(request.phone) < 10:
            raise HTTPException(status_code=400, detail="Invalid phone number")
        
        # Validate name
        if not request.name or len(request.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name is required")
        
        # Validate role
        if request.role not in ['admin', 'staff', 'viewer']:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Check if user exists
        existing_user = await db.users.find_one({"phone": request.phone})
        
        if existing_user:
            # Update existing user
            await db.users.update_one(
                {"phone": request.phone},
                {
                    "$set": {
                        "name": request.name.strip(),
                        "role": request.role,
                    }
                }
            )
            user_data = serialize_doc(existing_user)
            user_data["name"] = request.name.strip()
            user_data["role"] = request.role
            
            logger.info(f"✅ User logged in: {request.name} ({request.phone}) - Role: {request.role}")
        else:
            # Create new user
            user = User(
                phone=request.phone,
                name=request.name.strip(),
                role=request.role
            )
            result = await db.users.insert_one(user.dict())
            user_data = serialize_doc({**user.dict(), "_id": result.inserted_id})
            
            logger.info(f"🆕 New user created: {request.name} ({request.phone}) - Role: {request.role}")
        
        # Generate a simple session token
        import hashlib
        import time
        session_token = hashlib.sha256(
            f"{request.phone}_{time.time()}".encode()
        ).hexdigest()
        
        return {
            "success": True,
            "user": user_data,
            "token": session_token,
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in instant login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """
    OTP sending endpoint - Firebase handles actual SMS delivery from client.
    For mobile/development: Generate test OTP and log it.
    """
    try:
        # Generate a 6-digit OTP for development/testing
        import random
        test_otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # In development, log the OTP
        logger.info(f"🔐 OTP for {request.phone}: {test_otp}")
        print(f"\n{'='*50}")
        print(f"📱 OTP SENT TO: {request.phone}")
        print(f"🔢 OTP CODE: {test_otp}")
        print(f"⏰ Valid for: 5 minutes")
        print(f"{'='*50}\n")
        
        # Store OTP in memory for verification (in production, use Redis or similar)
        # For now, we'll accept any 6-digit code in dev mode
        
        return {
            "success": True,
            "message": "OTP sent successfully",
            "phone": request.phone,
            "dev_otp": test_otp if os.environ.get('ENV') == 'development' else None
        }
    except Exception as e:
        logger.error(f"Error sending OTP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """
    Verify OTP and create/update user in MongoDB
    """
    try:
        # Verify the Firebase token
        decoded_token = auth.verify_id_token(request.otp_token)
        phone = decoded_token.get("phone_number", request.phone)
        
        # Check if user exists
        existing_user = await db.users.find_one({"phone": phone})
        
        if existing_user:
            user_data = serialize_doc(existing_user)
        else:
            # Create new user
            user = User(
                phone=phone,
                name=request.name or f"User {phone[-4:]}",
                role="admin"
            )
            result = await db.users.insert_one(user.dict())
            user_data = serialize_doc({**user.dict(), "_id": result.inserted_id})
        
        return {
            "success": True,
            "user": user_data,
            "token": request.otp_token
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== EVENT ENDPOINTS ====================
@api_router.post("/events")
async def create_event(event_data: CreateEventRequest, user_id: str):
    """Create a new wedding event with QR code"""
    try:
        # Generate unique event code
        event_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"CHADIVIMPULU:{event_code}")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        event = Event(
            name=event_data.name,
            date=event_data.date,
            location=event_data.location,
            code=event_code,
            qr_code_data=qr_base64,
            owner_id=user_id
        )
        
        result = await db.events.insert_one(event.dict())
        event_doc = serialize_doc({**event.dict(), "_id": result.inserted_id})
        
        # Update user's current event
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"current_event_id": str(result.inserted_id)}}
        )
        
        return {"success": True, "event": event_doc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/events")
async def get_user_events(user_id: str):
    """Get all events for a user"""
    try:
        # Get events where user is owner
        owned_events = await db.events.find({"owner_id": user_id}).to_list(100)
        
        # Get events where user is staff
        staff_records = await db.staff.find({"user_id": user_id}).to_list(100)
        staff_event_ids = [s["event_id"] for s in staff_records]
        
        staff_events = []
        if staff_event_ids:
            staff_events = await db.events.find(
                {"_id": {"$in": [ObjectId(eid) for eid in staff_event_ids]}}
            ).to_list(100)
        
        all_events = owned_events + staff_events
        return {"success": True, "events": [serialize_doc(e) for e in all_events]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Get specific event details"""
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"success": True, "event": serialize_doc(event)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== GIFT ENTRY ENDPOINTS ====================
@api_router.post("/gifts")
async def create_gift_entry(gift: GiftEntry):
    """Add a new gift entry"""
    try:
        result = await db.gift_entries.insert_one(gift.dict())
        gift_doc = serialize_doc({**gift.dict(), "_id": result.inserted_id})
        return {"success": True, "gift": gift_doc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/gifts/{event_id}")
async def get_gifts(
    event_id: str,
    side: Optional[str] = None,
    gift_type: Optional[str] = None,
    payment_mode: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all gift entries for an event with optional filters"""
    try:
        query = {"event_id": event_id}
        
        if side:
            query["side"] = side
        if gift_type:
            query["gift_type"] = gift_type
        if payment_mode:
            query["payment_mode"] = payment_mode
        if search:
            query["$or"] = [
                {"guest_name": {"$regex": search, "$options": "i"}},
                {"mobile": {"$regex": search, "$options": "i"}}
            ]
        
        gifts = await db.gift_entries.find(query).sort("timestamp", -1).to_list(1000)
        return {"success": True, "gifts": [serialize_doc(g) for g in gifts]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/gifts/detail/{gift_id}")
async def get_gift_detail(gift_id: str):
    """Get specific gift entry"""
    try:
        gift = await db.gift_entries.find_one({"_id": ObjectId(gift_id)})
        if not gift:
            raise HTTPException(status_code=404, detail="Gift entry not found")
        return {"success": True, "gift": serialize_doc(gift)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/gifts/{gift_id}")
async def update_gift_entry(gift_id: str, update_data: UpdateGiftEntryRequest):
    """Update a gift entry"""
    try:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No data to update")
        
        result = await db.gift_entries.update_one(
            {"_id": ObjectId(gift_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Gift entry not found")
        
        updated_gift = await db.gift_entries.find_one({"_id": ObjectId(gift_id)})
        return {"success": True, "gift": serialize_doc(updated_gift)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/gifts/{gift_id}")
async def delete_gift_entry(gift_id: str):
    """Delete a gift entry"""
    try:
        result = await db.gift_entries.delete_one({"_id": ObjectId(gift_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Gift entry not found")
        
        return {"success": True, "message": "Gift entry deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== DASHBOARD ENDPOINTS ====================
@api_router.get("/dashboard/{event_id}")
async def get_dashboard_stats(event_id: str):
    """Get dashboard statistics for an event"""
    try:
        gifts = await db.gift_entries.find({"event_id": event_id}).to_list(10000)
        
        total_guests = len(gifts)
        total_cash = sum(g.get("amount", 0) or 0 for g in gifts if g.get("gift_type") == "cash")
        total_items = sum(1 for g in gifts if g.get("gift_type") == "item")
        
        # Side-wise breakdown
        bride_gifts = [g for g in gifts if g.get("side") == "bride"]
        groom_gifts = [g for g in gifts if g.get("side") == "groom"]
        
        bride_cash = sum(g.get("amount", 0) or 0 for g in bride_gifts if g.get("gift_type") == "cash")
        groom_cash = sum(g.get("amount", 0) or 0 for g in groom_gifts if g.get("gift_type") == "cash")
        
        # Recent entries (last 10)
        recent = sorted(gifts, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:10]
        
        # Payment mode breakdown
        cash_payments = sum(1 for g in gifts if g.get("payment_mode") == "cash")
        upi_payments = sum(1 for g in gifts if g.get("payment_mode") == "upi")
        
        return {
            "success": True,
            "stats": {
                "total_guests": total_guests,
                "total_cash": total_cash,
                "total_items": total_items,
                "bride_side": {
                    "guests": len(bride_gifts),
                    "cash": bride_cash
                },
                "groom_side": {
                    "guests": len(groom_gifts),
                    "cash": groom_cash
                },
                "payment_modes": {
                    "cash": cash_payments,
                    "upi": upi_payments
                },
                "recent_entries": [serialize_doc(g) for g in recent]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== REPORTS & ANALYTICS ENDPOINTS ====================
@api_router.get("/reports/{event_id}")
async def get_analytics_report(event_id: str):
    """Get detailed analytics with AI insights"""
    try:
        gifts = await db.gift_entries.find({"event_id": event_id}).to_list(10000)
        
        if not gifts:
            return {
                "success": True,
                "analytics": {
                    "top_contributors": [],
                    "insights": [],
                    "patterns": {}
                }
            }
        
        # Top contributors (by amount)
        cash_gifts = [g for g in gifts if g.get("gift_type") == "cash" and g.get("amount")]
        top_contributors = sorted(
            cash_gifts,
            key=lambda x: x.get("amount", 0),
            reverse=True
        )[:10]
        
        # AI Insights
        insights = []
        
        # Average gift amount
        if cash_gifts:
            avg_amount = sum(g.get("amount", 0) for g in cash_gifts) / len(cash_gifts)
            insights.append(f"Average cash gift: ₹{avg_amount:,.2f}")
        
        # Peak contribution time
        timestamps = [g.get("timestamp") for g in gifts if g.get("timestamp")]
        if timestamps:
            hour_counts = defaultdict(int)
            for ts in timestamps:
                hour_counts[ts.hour] += 1
            peak_hour = max(hour_counts, key=hour_counts.get)
            insights.append(f"Peak entry time: {peak_hour}:00 - {peak_hour+1}:00")
        
        # Side comparison
        bride_count = len([g for g in gifts if g.get("side") == "bride"])
        groom_count = len([g for g in gifts if g.get("side") == "groom"])
        if bride_count > groom_count:
            insights.append(f"Bride's side has {bride_count - groom_count} more guests")
        elif groom_count > bride_count:
            insights.append(f"Groom's side has {groom_count - bride_count} more guests")
        else:
            insights.append("Both sides have equal number of guests")
        
        # Payment preference
        cash_count = len([g for g in gifts if g.get("payment_mode") == "cash"])
        upi_count = len([g for g in gifts if g.get("payment_mode") == "upi"])
        if upi_count > cash_count:
            insights.append(f"{(upi_count/len(gifts)*100):.1f}% prefer UPI payments")
        else:
            insights.append(f"{(cash_count/len(gifts)*100):.1f}% prefer cash payments")
        
        return {
            "success": True,
            "analytics": {
                "top_contributors": [
                    {
                        "name": g.get("guest_name"),
                        "amount": g.get("amount"),
                        "side": g.get("side")
                    }
                    for g in top_contributors
                ],
                "insights": insights,
                "patterns": {
                    "total_entries": len(gifts),
                    "cash_vs_items": {
                        "cash": len([g for g in gifts if g.get("gift_type") == "cash"]),
                        "items": len([g for g in gifts if g.get("gift_type") == "item"])
                    },
                    "payment_modes": {
                        "cash": cash_count,
                        "upi": upi_count
                    }
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/export/pdf/{event_id}")
async def export_pdf(event_id: str):
    """Export gift entries as PDF"""
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        gifts = await db.gift_entries.find({"event_id": event_id}).sort("timestamp", -1).to_list(10000)
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, 750, f"Wedding Gift Report - {event.get('name', 'Event')}")
        p.setFont("Helvetica", 10)
        p.drawString(50, 730, f"Date: {event.get('date', '')}")
        p.drawString(50, 715, f"Location: {event.get('location', '')}")
        
        # Summary
        total_cash = sum(g.get("amount", 0) or 0 for g in gifts if g.get("gift_type") == "cash")
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, 690, f"Total Guests: {len(gifts)}")
        p.drawString(250, 690, f"Total Cash: ₹{total_cash:,.2f}")
        
        # Table header
        y = 660
        p.setFont("Helvetica-Bold", 9)
        p.drawString(50, y, "Guest Name")
        p.drawString(150, y, "Side")
        p.drawString(200, y, "Type")
        p.drawString(250, y, "Amount")
        p.drawString(320, y, "Payment")
        
        # Entries
        p.setFont("Helvetica", 8)
        y -= 20
        for gift in gifts[:50]:  # First 50 entries
            if y < 50:
                p.showPage()
                y = 750
            
            p.drawString(50, y, str(gift.get("guest_name", ""))[:15])
            p.drawString(150, y, str(gift.get("side", ""))[:10])
            p.drawString(200, y, str(gift.get("gift_type", ""))[:10])
            if gift.get("gift_type") == "cash":
                p.drawString(250, y, f"₹{gift.get('amount', 0):,.2f}")
            else:
                p.drawString(250, y, str(gift.get("item_description", ""))[:15])
            p.drawString(320, y, str(gift.get("payment_mode", ""))[:10])
            y -= 15
        
        p.save()
        
        pdf_base64 = base64.b64encode(buffer.getvalue()).decode()
        return {"success": True, "pdf_data": pdf_base64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/export/excel/{event_id}")
async def export_excel(event_id: str):
    """Export gift entries as Excel"""
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        gifts = await db.gift_entries.find({"event_id": event_id}).sort("timestamp", -1).to_list(10000)
        
        wb = Workbook()
        ws = wb.active
        ws.title = "Gift Entries"
        
        # Header
        headers = ["Guest Name", "Mobile", "Side", "Gift Type", "Amount", "Item Description", "Payment Mode", "Notes", "Added By", "Timestamp"]
        ws.append(headers)
        
        # Style header
        header_fill = PatternFill(start_color="FFD700", end_color="FFD700", fill_type="solid")
        header_font = Font(bold=True)
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
        
        # Add data
        for gift in gifts:
            ws.append([
                gift.get("guest_name", ""),
                gift.get("mobile", ""),
                gift.get("side", ""),
                gift.get("gift_type", ""),
                gift.get("amount", "") if gift.get("gift_type") == "cash" else "",
                gift.get("item_description", ""),
                gift.get("payment_mode", ""),
                gift.get("notes", ""),
                gift.get("added_by", ""),
                str(gift.get("timestamp", ""))
            ])
        
        # Save to buffer
        buffer = io.BytesIO()
        wb.save(buffer)
        excel_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {"success": True, "excel_data": excel_base64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== STAFF MANAGEMENT ENDPOINTS ====================
@api_router.post("/staff")
async def add_staff(staff_data: AddStaffRequest):
    """Add staff member to event"""
    try:
        # Find or create user
        user = await db.users.find_one({"phone": staff_data.phone})
        
        if not user:
            new_user = User(
                phone=staff_data.phone,
                name=f"Staff {staff_data.phone[-4:]}",
                role=staff_data.role
            )
            result = await db.users.insert_one(new_user.dict())
            user_id = str(result.inserted_id)
        else:
            user_id = str(user["_id"])
        
        # Add staff record
        staff = Staff(
            user_id=user_id,
            event_id=staff_data.event_id,
            role=staff_data.role
        )
        
        await db.staff.insert_one(staff.dict())
        
        return {"success": True, "message": "Staff added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/staff/{event_id}")
async def get_event_staff(event_id: str):
    """Get all staff for an event"""
    try:
        staff_records = await db.staff.find({"event_id": event_id}).to_list(100)
        
        staff_list = []
        for record in staff_records:
            user = await db.users.find_one({"_id": ObjectId(record["user_id"])})
            if user:
                staff_list.append({
                    **serialize_doc(record),
                    "user": serialize_doc(user)
                })
        
        return {"success": True, "staff": staff_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/staff/{staff_id}")
async def remove_staff(staff_id: str):
    """Remove staff member"""
    try:
        result = await db.staff.delete_one({"_id": ObjectId(staff_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Staff not found")
        
        return {"success": True, "message": "Staff removed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
