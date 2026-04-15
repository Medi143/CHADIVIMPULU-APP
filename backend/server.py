from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
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
import bcrypt
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Pydantic Models
class User(BaseModel):
    phone: str
    name: Optional[str] = None
    role: str = "admin"
    current_event_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InstantLoginRequest(BaseModel):
    phone: str
    name: str
    role: str = "admin"

class CreateEventRequest(BaseModel):
    name: str
    date: str
    location: str
    event_type: str = "wedding"
    family_head_name: Optional[str] = None
    bride_name: Optional[str] = None
    groom_name: Optional[str] = None
    event_person_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    couple_photo: Optional[str] = None
    qr_code: Optional[str] = None
    user_id: Optional[str] = None

class GiftEntryRequest(BaseModel):
    event_id: str
    guest_name: str
    area: Optional[str] = None
    mobile: Optional[str] = None
    side: str = "bride"
    gift_type: str = "cash"
    amount: Optional[float] = None
    item_description: Optional[str] = None
    payment_mode: Optional[str] = "cash"
    notes: Optional[str] = None
    added_by: Optional[str] = None
    remote_gift: Optional[bool] = False

class UpdateGiftEntryRequest(BaseModel):
    guest_name: Optional[str] = None
    mobile: Optional[str] = None
    area: Optional[str] = None
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

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    profile_photo: Optional[str] = None

class RegisterRequest(BaseModel):
    name: str
    identifier: str  # phone or email
    password: str

class LoginRequest(BaseModel):
    identifier: str  # phone or email
    password: str

class ResetPasswordRequest(BaseModel):
    phone: str
    new_password: str

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register")
async def register_user(request: RegisterRequest):
    try:
        if not request.name or len(request.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
        if not request.identifier or len(request.identifier.strip()) < 5:
            raise HTTPException(status_code=400, detail="Mobile number or email is required")
        if not request.password or len(request.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        identifier = request.identifier.strip()
        # Check if user already exists
        existing = await db.users.find_one({
            "$or": [{"phone": identifier}, {"email": identifier}]
        })
        if existing:
            raise HTTPException(status_code=400, detail="An account with this mobile/email already exists")
        
        # Hash password
        hashed_pw = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Determine if identifier is email or phone
        is_email = '@' in identifier
        user_doc = {
            "name": request.name.strip(),
            "phone": identifier if not is_email else "",
            "email": identifier if is_email else "",
            "password": hashed_pw,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = await db.users.insert_one(user_doc)
        logger.info(f"New user registered: {request.name} ({identifier})")
        return {"success": True, "message": "Registration successful. Please sign in."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in registration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login_user(request: LoginRequest):
    try:
        identifier = request.identifier.strip()
        if not identifier:
            raise HTTPException(status_code=400, detail="Mobile number or email is required")
        if not request.password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        # Find user by phone or email
        user = await db.users.find_one({
            "$or": [{"phone": identifier}, {"email": identifier}]
        })
        
        if not user:
            raise HTTPException(status_code=401, detail="No account found with this mobile/email")
        
        stored_pw = user.get("password", "")
        if not stored_pw or not bcrypt.checkpw(request.password.encode('utf-8'), stored_pw.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        import hashlib, time
        session_token = hashlib.sha256(f"{identifier}_{time.time()}".encode()).hexdigest()
        user_data = serialize_doc(user)
        user_data.pop("password", None)
        
        logger.info(f"User logged in: {user.get('name')} ({identifier})")
        return {"success": True, "user": user_data, "token": session_token, "message": "Login successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        if not request.phone or len(request.phone.strip()) < 10:
            raise HTTPException(status_code=400, detail="Valid mobile number is required")
        if not request.new_password or len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        phone = request.phone.strip()
        user = await db.users.find_one({"phone": phone})
        if not user:
            raise HTTPException(status_code=404, detail="No account found with this mobile number")
        
        hashed_pw = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        await db.users.update_one({"phone": phone}, {"$set": {"password": hashed_pw}})
        
        logger.info(f"Password reset for: {phone}")
        return {"success": True, "message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in password reset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@api_router.post("/auth/instant-login")
async def instant_login(request: InstantLoginRequest):
    try:
        if not request.phone or len(request.phone) < 10:
            raise HTTPException(status_code=400, detail="Invalid phone number")
        
        if not request.name or len(request.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name is required")
        
        if request.role not in ['admin', 'staff', 'viewer']:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        existing_user = await db.users.find_one({"phone": request.phone})
        
        if existing_user:
            await db.users.update_one(
                {"phone": request.phone},
                {"$set": {"name": request.name.strip(), "role": request.role}}
            )
            user_data = serialize_doc(existing_user)
            user_data["name"] = request.name.strip()
            user_data["role"] = request.role
            logger.info(f"User logged in: {request.name} ({request.phone})")
        else:
            user = User(phone=request.phone, name=request.name.strip(), role=request.role)
            result = await db.users.insert_one(user.dict())
            user_data = serialize_doc({**user.dict(), "_id": result.inserted_id})
            logger.info(f"New user created: {request.name} ({request.phone})")
        
        import hashlib
        import time
        session_token = hashlib.sha256(f"{request.phone}_{time.time()}".encode()).hexdigest()
        
        return {"success": True, "user": user_data, "token": session_token, "message": "Login successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in instant login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER PROFILE ENDPOINTS ====================
@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True, "user": serialize_doc(user)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/users/{user_id}")
async def update_user_profile(user_id: str, profile: UpdateProfileRequest):
    try:
        update_dict = {k: v for k, v in profile.dict().items() if v is not None}
        if not update_dict:
            raise HTTPException(status_code=400, detail="No data to update")
        
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        logger.info(f"User profile updated: {user_id}")
        return {"success": True, "user": serialize_doc(updated_user)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/users/{user_id}")
async def delete_user_account(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user's events and associated gifts
        user_events = await db.events.find({"owner_id": user_id}).to_list(100)
        for event in user_events:
            event_id = str(event["_id"])
            await db.gift_entries.delete_many({"event_id": event_id})
            await db.staff.delete_many({"event_id": event_id})
            await db.counters.delete_one({"_id": f"gift_sno_{event_id}"})
        
        await db.events.delete_many({"owner_id": user_id})
        await db.staff.delete_many({"user_id": user_id})
        await db.users.delete_one({"_id": ObjectId(user_id)})
        
        logger.info(f"User account deleted: {user_id}")
        return {"success": True, "message": "Account and all associated data deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== EVENT ENDPOINTS ====================
@api_router.post("/events")
async def create_event(event_data: CreateEventRequest):
    try:
        event_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        event_doc = {
            "name": event_data.name,
            "date": event_data.date,
            "location": event_data.location,
            "event_type": event_data.event_type,
            "family_head_name": event_data.family_head_name,
            "bride_name": event_data.bride_name,
            "groom_name": event_data.groom_name,
            "event_person_name": event_data.event_person_name,
            "phone_number": event_data.phone_number,
            "email": event_data.email,
            "address": event_data.address,
            "couple_photo": event_data.couple_photo,
            "qr_code": event_data.qr_code,
            "code": event_code,
            "owner_id": event_data.user_id,
            "guest_count": 0,
            "guest_limit": 500,
            "created_at": datetime.utcnow(),
        }
        
        result = await db.events.insert_one(event_doc)
        event_doc["_id"] = result.inserted_id
        
        # Update user's current event
        if event_data.user_id:
            try:
                await db.users.update_one(
                    {"_id": ObjectId(event_data.user_id)},
                    {"$set": {"current_event_id": str(result.inserted_id)}}
                )
            except Exception:
                # user_id might not be a valid ObjectId, try phone lookup
                pass
        
        # Initialize gift counter for this event
        await db.counters.update_one(
            {"_id": f"gift_sno_{str(result.inserted_id)}"},
            {"$setOnInsert": {"seq": 0}},
            upsert=True
        )
        
        logger.info(f"Event created: {event_data.name} (Code: {event_code})")
        return {"success": True, "event": serialize_doc(event_doc)}
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/events")
async def get_user_events(user_id: str):
    try:
        owned_events = await db.events.find({"owner_id": user_id}).to_list(100)
        
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


# ============ Search Events (Public) ============
@api_router.get("/events/search")
async def search_events(q: str = ""):
    """Search events by name, phone, location, couple names. Returns public event info."""
    try:
        if not q or len(q.strip()) < 2:
            return {"success": True, "events": []}
        
        query_str = q.strip()
        escaped = re.escape(query_str)
        regex = {"$regex": escaped, "$options": "i"}
        
        search_query = {
            "$or": [
                {"name": regex},
                {"location": regex},
                {"address": regex},
                {"bride_name": regex},
                {"groom_name": regex},
                {"event_person_name": regex},
                {"family_head_name": regex},
                {"phone_number": regex},
            ]
        }
        
        events = await db.events.find(search_query, {
            "name": 1, "event_type": 1, "location": 1, "date": 1,
            "bride_name": 1, "groom_name": 1, "event_person_name": 1,
            "family_head_name": 1, "phone_number": 1, "guest_count": 1
        }).sort("date", -1).to_list(20)
        
        safe_events = []
        for event in events:
            phone = event.get("phone_number", "")
            masked_phone = ""
            if phone and len(phone) >= 4:
                masked_phone = "****" + phone[-4:]
            
            safe_events.append({
                "_id": str(event["_id"]),
                "name": event.get("name", ""),
                "event_type": event.get("event_type", ""),
                "location": event.get("location", ""),
                "date": event.get("date", ""),
                "bride_name": event.get("bride_name", ""),
                "groom_name": event.get("groom_name", ""),
                "event_person_name": event.get("event_person_name", ""),
                "couple_photo": event.get("couple_photo", ""),
                "phone_masked": masked_phone,
                "guest_count": event.get("guest_count", 0),
            })
        
        return {"success": True, "events": safe_events}
    except Exception as e:
        logger.error(f"Error searching events: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"success": True, "event": serialize_doc(event)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== GIFT ENTRY ENDPOINTS ====================
async def get_next_sno(event_id: str) -> int:
    """Auto-increment S.No for gift entries per event"""
    result = await db.counters.find_one_and_update(
        {"_id": f"gift_sno_{event_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result["seq"]

@api_router.post("/gifts")
async def create_gift_entry(gift: GiftEntryRequest):
    try:
        # Get auto-increment S.No
        s_no = await get_next_sno(gift.event_id)
        
        gift_doc = {
            "s_no": s_no,
            "event_id": gift.event_id,
            "guest_name": gift.guest_name,
            "area": gift.area,
            "mobile": gift.mobile,
            "side": gift.side,
            "gift_type": gift.gift_type,
            "amount": gift.amount,
            "item_description": gift.item_description,
            "payment_mode": gift.payment_mode,
            "notes": gift.notes,
            "added_by": gift.added_by,
            "remote_gift": gift.remote_gift or False,
            "timestamp": datetime.utcnow(),
        }
        
        result = await db.gift_entries.insert_one(gift_doc)
        gift_doc["_id"] = result.inserted_id
        
        # Update guest count on event
        await db.events.update_one(
            {"_id": ObjectId(gift.event_id)},
            {"$inc": {"guest_count": 1}}
        )
        
        logger.info(f"Gift entry #{s_no} added for event {gift.event_id}: {gift.guest_name}")
        return {"success": True, "gift": serialize_doc(gift_doc)}
    except Exception as e:
        logger.error(f"Error creating gift: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/gifts/{event_id}")
async def get_gifts(
    event_id: str,
    side: Optional[str] = None,
    gift_type: Optional[str] = None,
    payment_mode: Optional[str] = None,
    search: Optional[str] = None
):
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
                {"mobile": {"$regex": search, "$options": "i"}},
                {"area": {"$regex": search, "$options": "i"}}
            ]
        
        gifts = await db.gift_entries.find(query, {
            "_id": 1, "s_no": 1, "guest_name": 1, "area": 1, "mobile": 1,
            "amount": 1, "gift_type": 1, "payment_mode": 1, "side": 1,
            "timestamp": 1, "item_description": 1, "notes": 1, "added_by": 1,
            "remote_gift": 1, "event_id": 1
        }).sort("s_no", -1).to_list(1000)
        return {"success": True, "gifts": [serialize_doc(g) for g in gifts]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/gifts/detail/{gift_id}")
async def get_gift_detail(gift_id: str):
    try:
        gift = await db.gift_entries.find_one({"_id": ObjectId(gift_id)})
        if not gift:
            raise HTTPException(status_code=404, detail="Gift entry not found")
        return {"success": True, "gift": serialize_doc(gift)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/gifts/{gift_id}")
async def update_gift_entry(gift_id: str, update_data: UpdateGiftEntryRequest):
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
    try:
        gifts = await db.gift_entries.find({"event_id": event_id}, {
            "_id": 1, "gift_type": 1, "amount": 1, "side": 1,
            "payment_mode": 1, "timestamp": 1, "guest_name": 1,
            "area": 1, "s_no": 1, "added_by": 1, "item_description": 1
        }).to_list(10000)
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        
        total_guests = len(gifts)
        total_cash = sum(g.get("amount", 0) or 0 for g in gifts if g.get("gift_type") == "cash")
        total_items = sum(1 for g in gifts if g.get("gift_type") == "item")
        
        bride_gifts = [g for g in gifts if g.get("side") == "bride"]
        groom_gifts = [g for g in gifts if g.get("side") == "groom"]
        
        bride_cash = sum(g.get("amount", 0) or 0 for g in bride_gifts if g.get("gift_type") == "cash")
        groom_cash = sum(g.get("amount", 0) or 0 for g in groom_gifts if g.get("gift_type") == "cash")
        
        recent = sorted(gifts, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:10]
        
        cash_payments = sum(1 for g in gifts if g.get("payment_mode") == "cash")
        upi_payments = sum(1 for g in gifts if g.get("payment_mode") == "upi")
        
        return {
            "success": True,
            "stats": {
                "total_guests": total_guests,
                "total_cash": total_cash,
                "total_items": total_items,
                "guest_limit": event.get("guest_limit", 500) if event else 500,
                "bride_side": {"guests": len(bride_gifts), "cash": bride_cash},
                "groom_side": {"guests": len(groom_gifts), "cash": groom_cash},
                "payment_modes": {"cash": cash_payments, "upi": upi_payments},
                "recent_entries": [serialize_doc(g) for g in recent]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== REPORTS & ANALYTICS ENDPOINTS ====================
@api_router.get("/reports/{event_id}")
async def get_analytics_report(event_id: str):
    try:
        gifts = await db.gift_entries.find({"event_id": event_id}, {
            "s_no": 1, "guest_name": 1, "area": 1, "amount": 1,
            "payment_mode": 1, "side": 1, "gift_type": 1,
            "timestamp": 1, "item_description": 1
        }).sort("s_no", 1).to_list(10000)
        
        if not gifts:
            return {
                "success": True,
                "analytics": {
                    "top_contributors": [],
                    "insights": [],
                    "patterns": {},
                    "all_entries": []
                }
            }
        
        cash_gifts = [g for g in gifts if g.get("gift_type") == "cash" and g.get("amount")]
        top_contributors = sorted(cash_gifts, key=lambda x: x.get("amount", 0), reverse=True)[:10]
        
        insights = []
        if cash_gifts:
            avg_amount = sum(g.get("amount", 0) for g in cash_gifts) / len(cash_gifts)
            insights.append(f"Average cash gift: ₹{avg_amount:,.2f}")
        
        timestamps = [g.get("timestamp") for g in gifts if g.get("timestamp")]
        if timestamps:
            hour_counts = defaultdict(int)
            for ts in timestamps:
                if hasattr(ts, 'hour'):
                    hour_counts[ts.hour] += 1
            if hour_counts:
                peak_hour = max(hour_counts, key=hour_counts.get)
                insights.append(f"Peak entry time: {peak_hour}:00 - {peak_hour+1}:00")
        
        bride_count = len([g for g in gifts if g.get("side") == "bride"])
        groom_count = len([g for g in gifts if g.get("side") == "groom"])
        if bride_count > groom_count:
            insights.append(f"Bride's side has {bride_count - groom_count} more guests")
        elif groom_count > bride_count:
            insights.append(f"Groom's side has {groom_count - bride_count} more guests")
        else:
            insights.append("Both sides have equal number of guests")
        
        cash_count = len([g for g in gifts if g.get("payment_mode") == "cash"])
        upi_count = len([g for g in gifts if g.get("payment_mode") == "upi"])
        total = len(gifts)
        if total > 0:
            if upi_count > cash_count:
                insights.append(f"{(upi_count/total*100):.1f}% prefer UPI payments")
            else:
                insights.append(f"{(cash_count/total*100):.1f}% prefer cash payments")
        
        # All entries with S.No for reports table
        all_entries = []
        for g in gifts:
            all_entries.append({
                "s_no": g.get("s_no", 0),
                "guest_name": g.get("guest_name", ""),
                "area": g.get("area", ""),
                "amount": g.get("amount", 0),
                "payment_mode": g.get("payment_mode", ""),
                "side": g.get("side", ""),
                "gift_type": g.get("gift_type", ""),
                "timestamp": str(g.get("timestamp", "")),
                "_id": str(g.get("_id", "")),
            })
        
        return {
            "success": True,
            "analytics": {
                "top_contributors": [
                    {"name": g.get("guest_name"), "amount": g.get("amount"), "side": g.get("side")}
                    for g in top_contributors
                ],
                "insights": insights,
                "patterns": {
                    "total_entries": len(gifts),
                    "total_cash": sum(g.get("amount", 0) or 0 for g in cash_gifts),
                    "cash_vs_items": {
                        "cash": len([g for g in gifts if g.get("gift_type") == "cash"]),
                        "items": len([g for g in gifts if g.get("gift_type") == "item"])
                    },
                    "payment_modes": {"cash": cash_count, "upi": upi_count}
                },
                "all_entries": all_entries
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/export/pdf/{event_id}")
async def export_pdf(event_id: str):
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        gifts = await db.gift_entries.find({"event_id": event_id}, {
            "s_no": 1, "guest_name": 1, "area": 1, "amount": 1,
            "gift_type": 1, "payment_mode": 1, "side": 1, "item_description": 1
        }).sort("s_no", 1).to_list(10000)
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        w = letter[0]
        h = letter[1]
        
        # Color constants
        MAROON = colors.Color(0.55, 0.09, 0.09)
        GOLD = colors.Color(1.0, 0.84, 0.0)
        DARK_BLUE = colors.Color(0.10, 0.23, 0.42)
        LIGHT_GOLD_BG = colors.Color(1.0, 0.97, 0.85)
        LIGHT_GRAY = colors.Color(0.96, 0.96, 0.96)
        
        # === Compute stats ===
        total_guests = len(gifts)
        total_cash = sum(g.get("amount", 0) or 0 for g in gifts if g.get("gift_type") == "cash")
        total_items = sum(1 for g in gifts if g.get("gift_type") == "item")
        bride_gifts = [g for g in gifts if g.get("side") == "bride"]
        groom_gifts = [g for g in gifts if g.get("side") == "groom"]
        bride_cash = sum(g.get("amount", 0) or 0 for g in bride_gifts if g.get("gift_type") == "cash")
        groom_cash = sum(g.get("amount", 0) or 0 for g in groom_gifts if g.get("gift_type") == "cash")
        cash_count = sum(1 for g in gifts if g.get("payment_mode") == "cash")
        upi_count = sum(1 for g in gifts if g.get("payment_mode") == "upi")
        
        event_name = event.get('name', 'Event')
        event_type = event.get('event_type', 'event').title()
        event_date = event.get('date', 'N/A')
        event_location = event.get('location', 'N/A')
        
        def draw_footer(canvas_obj):
            canvas_obj.setFont("Helvetica", 8)
            canvas_obj.setFillColor(colors.Color(0.5, 0.5, 0.5))
            canvas_obj.drawCentredString(w / 2, 25, "\u00a92026 Chadivimpulu\u2122. All rights reserved. \u2013 www.chadivimpulu.com")
            canvas_obj.setFillColor(colors.black)
        
        def draw_page_header(canvas_obj, y_pos):
            # Maroon header bar
            canvas_obj.setFillColor(MAROON)
            canvas_obj.rect(0, y_pos, w, 50, fill=True, stroke=False)
            # Gold accent line
            canvas_obj.setFillColor(GOLD)
            canvas_obj.rect(0, y_pos - 4, w, 4, fill=True, stroke=False)
            # Title text
            canvas_obj.setFillColor(colors.white)
            canvas_obj.setFont("Helvetica-Bold", 22)
            canvas_obj.drawCentredString(w / 2, y_pos + 16, "Chadivimpulu\u2122")
            canvas_obj.setFillColor(colors.black)
            return y_pos - 10
        
        # ======== PAGE 1 ========
        y = draw_page_header(p, h - 50)
        
        # Wedding Information Box
        y -= 15
        # Box background
        p.setFillColor(LIGHT_GOLD_BG)
        p.roundRect(40, y - 80, w - 80, 80, 8, fill=True, stroke=False)
        # Maroon border
        p.setStrokeColor(MAROON)
        p.setLineWidth(1.5)
        p.roundRect(40, y - 80, w - 80, 80, 8, fill=False, stroke=True)
        
        # Wedding Info title
        p.setFillColor(MAROON)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(55, y - 20, f"{event_type} Information")
        
        # Info details
        p.setFillColor(DARK_BLUE)
        p.setFont("Helvetica-Bold", 11)
        p.drawString(55, y - 40, event_name)
        
        p.setFillColor(colors.Color(0.3, 0.3, 0.3))
        p.setFont("Helvetica", 9)
        p.drawString(55, y - 56, f"Date: {event_date}")
        p.drawString(250, y - 56, f"Location: {event_location}")
        p.drawString(55, y - 70, f"Organizer: {event.get('family_head_name', 'N/A')}")
        p.drawString(250, y - 70, f"Total Guests: {total_guests}")
        
        y -= 100
        
        # === SUMMARY CARDS ===
        y -= 10
        p.setFillColor(MAROON)
        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Summary")
        y -= 20
        
        card_w = (w - 120) / 3
        card_h = 50
        cards_data = [
            ("Total Guests", str(total_guests)),
            ("Total Cash", f"\u20b9{total_cash:,.0f}"),
            ("Total Items", str(total_items)),
            ("Cash Payments", str(cash_count)),
            ("UPI Payments", str(upi_count)),
            ("Bride / Groom", f"{len(bride_gifts)} / {len(groom_gifts)}"),
        ]
        
        for i, (label, value) in enumerate(cards_data):
            col = i % 3
            row = i // 3
            cx = 50 + col * (card_w + 10)
            cy = y - row * (card_h + 8)
            
            # Card background
            p.setFillColor(GOLD)
            p.roundRect(cx, cy - card_h, card_w, card_h, 6, fill=True, stroke=False)
            
            # Card text
            p.setFillColor(DARK_BLUE)
            p.setFont("Helvetica-Bold", 13)
            p.drawCentredString(cx + card_w / 2, cy - 22, value)
            p.setFont("Helvetica", 8)
            p.setFillColor(colors.Color(0.2, 0.2, 0.2))
            p.drawCentredString(cx + card_w / 2, cy - 38, label)
        
        y -= (2 * (card_h + 8)) + 15
        
        # === GUEST ENTRIES TABLE ===
        p.setFillColor(MAROON)
        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Guest Entries")
        y -= 20
        
        # Table header
        col_positions = [50, 80, 195, 290, 380, 480]
        col_labels = ["S.No", "Guest Name", "Area", "Amount / Item", "Payment", "Side"]
        
        p.setFillColor(GOLD)
        p.rect(45, y - 5, w - 90, 20, fill=True, stroke=False)
        
        p.setFillColor(DARK_BLUE)
        p.setFont("Helvetica-Bold", 9)
        for i, label in enumerate(col_labels):
            p.drawString(col_positions[i], y, label)
        
        p.setFillColor(colors.black)
        p.setFont("Helvetica", 8)
        y -= 20
        
        for idx, gift in enumerate(gifts):
            if y < 55:
                draw_footer(p)
                p.showPage()
                # New page header
                ny = draw_page_header(p, h - 50)
                y = ny - 20
                # Re-draw table header
                p.setFillColor(GOLD)
                p.rect(45, y - 5, w - 90, 20, fill=True, stroke=False)
                p.setFillColor(DARK_BLUE)
                p.setFont("Helvetica-Bold", 9)
                for i, label in enumerate(col_labels):
                    p.drawString(col_positions[i], y, label)
                p.setFillColor(colors.black)
                p.setFont("Helvetica", 8)
                y -= 20
            
            # Alternating row color
            if idx % 2 == 0:
                p.setFillColor(LIGHT_GRAY)
                p.rect(45, y - 4, w - 90, 16, fill=True, stroke=False)
                p.setFillColor(colors.black)
            
            p.drawString(col_positions[0], y, str(gift.get("s_no", idx + 1)))
            p.drawString(col_positions[1], y, str(gift.get("guest_name", ""))[:18])
            p.drawString(col_positions[2], y, str(gift.get("area", ""))[:14])
            
            if gift.get("gift_type") == "cash":
                p.drawString(col_positions[3], y, f"\u20b9{gift.get('amount', 0):,.0f}")
            else:
                item_desc = gift.get("item_description") or gift.get("gift_item") or "Item"
                p.drawString(col_positions[3], y, str(item_desc)[:16])
            
            mode = str(gift.get("payment_mode", "")).upper()
            if gift.get("gift_type") == "item":
                mode = "ITEM"
            p.drawString(col_positions[4], y, mode[:10])
            p.drawString(col_positions[5], y, str(gift.get("side", "")).title()[:10])
            
            y -= 16
        
        draw_footer(p)
        p.save()
        pdf_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        safe_name = event_name.replace(' ', '_')[:30]
        return {"success": True, "pdf_data": pdf_base64, "file_name": f"Chadivimpulu_{safe_name}.pdf"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/export/excel/{event_id}")
async def export_excel(event_id: str):
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        gifts = await db.gift_entries.find({"event_id": event_id}, {
            "s_no": 1, "guest_name": 1, "area": 1, "amount": 1,
            "gift_type": 1, "payment_mode": 1, "side": 1, "timestamp": 1
        }).sort("s_no", 1).to_list(10000)
        
        wb = Workbook()
        
        # === Sheet 1: Summary ===
        ws_summary = wb.active
        ws_summary.title = "Summary"
        
        title_font = Font(bold=True, size=14)
        header_fill = PatternFill(start_color="1B3A61", end_color="1B3A61", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        gold_fill = PatternFill(start_color="FFD700", end_color="FFD700", fill_type="solid")
        gold_font = Font(bold=True)
        
        ws_summary.append(["Chadivimpulu - Gift Report"])
        ws_summary['A1'].font = title_font
        ws_summary.append([])
        ws_summary.append(["Event Name:", event.get('name', '')])
        ws_summary.append(["Event Date:", event.get('date', '')])
        ws_summary.append(["Location:", event.get('location', '')])
        ws_summary.append(["Organizer:", event.get('family_head_name', '')])
        ws_summary.append(["Event Type:", event.get('event_type', '').title()])
        ws_summary.append([])
        
        total_cash = sum(g.get("amount", 0) or 0 for g in gifts if g.get("gift_type") == "cash")
        bride_gifts = [g for g in gifts if g.get("side") == "bride"]
        groom_gifts = [g for g in gifts if g.get("side") == "groom"]
        bride_cash = sum(g.get("amount", 0) or 0 for g in bride_gifts if g.get("gift_type") == "cash")
        groom_cash = sum(g.get("amount", 0) or 0 for g in groom_gifts if g.get("gift_type") == "cash")
        
        ws_summary.append(["Total Guests:", len(gifts)])
        ws_summary.append(["Total Cash:", f"Rs.{total_cash:,.2f}"])
        ws_summary.append(["Bride Side:", f"{len(bride_gifts)} guests, Rs.{bride_cash:,.2f}"])
        ws_summary.append(["Groom Side:", f"{len(groom_gifts)} guests, Rs.{groom_cash:,.2f}"])
        
        for cell in ['A3', 'A4', 'A5', 'A6', 'A7', 'A9', 'A10', 'A11', 'A12']:
            ws_summary[cell].font = Font(bold=True)
        
        ws_summary.column_dimensions['A'].width = 18
        ws_summary.column_dimensions['B'].width = 40
        
        # === Sheet 2: Gift Entries ===
        ws_entries = wb.create_sheet("Gift Entries")
        
        headers = ["S.No", "Name", "Area", "Amount", "Payment Mode", "Side", "Date"]
        ws_entries.append(headers)
        
        for cell in ws_entries[1]:
            cell.fill = header_fill
            cell.font = header_font
        
        for gift in gifts:
            ts = gift.get("timestamp")
            date_str = ""
            if ts:
                date_str = ts.strftime("%d/%m/%Y %H:%M") if hasattr(ts, 'strftime') else str(ts)[:16]
            
            ws_entries.append([
                gift.get("s_no", ""),
                gift.get("guest_name", ""),
                gift.get("area", ""),
                gift.get("amount", 0) if gift.get("gift_type") == "cash" else 0,
                gift.get("payment_mode", "").upper(),
                gift.get("side", "").title(),
                date_str,
            ])
        
        # Auto-width columns
        for col_letter in ['A', 'B', 'C', 'D', 'E', 'F', 'G']:
            ws_entries.column_dimensions[col_letter].width = 16
        ws_entries.column_dimensions['B'].width = 24
        
        buffer = io.BytesIO()
        wb.save(buffer)
        excel_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        event_name = event.get('name', 'Event').replace(' ', '_')[:30]
        return {"success": True, "excel_data": excel_base64, "file_name": f"Chadivimpulu_{event_name}.xlsx"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting Excel: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== STAFF MANAGEMENT ENDPOINTS ====================
@api_router.post("/staff")
async def add_staff(staff_data: AddStaffRequest):
    try:
        user = await db.users.find_one({"phone": staff_data.phone})
        
        if not user:
            new_user = User(phone=staff_data.phone, name=f"Staff {staff_data.phone[-4:]}", role=staff_data.role)
            result = await db.users.insert_one(new_user.dict())
            user_id = str(result.inserted_id)
        else:
            user_id = str(user["_id"])
        
        staff_doc = {
            "user_id": user_id,
            "event_id": staff_data.event_id,
            "role": staff_data.role,
            "added_at": datetime.utcnow()
        }
        await db.staff.insert_one(staff_doc)
        
        return {"success": True, "message": "Staff added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/staff/{event_id}")
async def get_event_staff(event_id: str):
    try:
        staff_records = await db.staff.find({"event_id": event_id}).to_list(100)
        
        staff_list = []
        for record in staff_records:
            user = await db.users.find_one({"_id": ObjectId(record["user_id"])})
            if user:
                staff_list.append({**serialize_doc(record), "user": serialize_doc(user)})
        
        return {"success": True, "staff": staff_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/staff/{staff_id}")
async def remove_staff(staff_id: str):
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
