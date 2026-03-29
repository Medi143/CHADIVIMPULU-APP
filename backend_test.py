#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Chadivimpulu Wedding Gift Tracking App
Tests all API endpoints with realistic wedding data
"""

import requests
import json
import time
import uuid
from datetime import datetime
import base64
from bson import ObjectId

# Configuration
BASE_URL = "https://gift-register.preview.emergentagent.com/api"
TIMEOUT = 30

class WeddingGiftAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_user_id = None
        self.test_event_id = None
        self.test_gift_ids = []
        self.test_staff_ids = []
        self.auth_token = None
        
        # Test data
        self.test_phone = "+919876543210"
        self.test_name = "Rajesh Kumar"
        self.test_event_data = {
            "name": "Priya & Arjun Wedding",
            "date": "2024-12-25",
            "location": "Grand Palace, Hyderabad"
        }
        
        # Sample gift entries with realistic Indian wedding data
        self.sample_gifts = [
            {
                "guest_name": "Sita Devi",
                "mobile": "+919876543211",
                "side": "bride",
                "gift_type": "cash",
                "amount": 5000.0,
                "payment_mode": "cash",
                "notes": "Blessing for the couple"
            },
            {
                "guest_name": "Ramesh Uncle",
                "mobile": "+919876543212", 
                "side": "groom",
                "gift_type": "cash",
                "amount": 10000.0,
                "payment_mode": "upi",
                "notes": "Wedding gift"
            },
            {
                "guest_name": "Lakshmi Aunty",
                "mobile": "+919876543213",
                "side": "bride", 
                "gift_type": "item",
                "item_description": "Gold necklace set",
                "payment_mode": "cash",
                "notes": "Family heirloom"
            },
            {
                "guest_name": "Venkat Reddy",
                "mobile": "+919876543214",
                "side": "groom",
                "gift_type": "cash", 
                "amount": 7500.0,
                "payment_mode": "upi",
                "notes": "Best wishes"
            }
        ]

    def log_test(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            print(f"   Error: {details}")
        print()

    def test_auth_send_otp(self):
        """Test OTP sending endpoint"""
        print("🔐 Testing Authentication - Send OTP")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/send-otp",
                json={"phone": self.test_phone},
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            data = response.json() if response.status_code == 200 else {}
            
            if success:
                details = f"OTP sent to {data.get('phone', 'unknown')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Send OTP", success, details)
            return success
            
        except Exception as e:
            self.log_test("Send OTP", False, str(e))
            return False

    def test_auth_verify_otp(self):
        """Test OTP verification - Note: This will fail without real Firebase token"""
        print("🔐 Testing Authentication - Verify OTP")
        
        try:
            # This will fail because we don't have a real Firebase token
            # But we can test the endpoint structure
            fake_token = "fake_firebase_token_for_testing"
            
            response = self.session.post(
                f"{BASE_URL}/auth/verify-otp",
                json={
                    "phone": self.test_phone,
                    "otp_token": fake_token,
                    "name": self.test_name
                },
                headers={"Content-Type": "application/json"}
            )
            
            # We expect this to fail with 400 due to invalid token
            if response.status_code == 400:
                details = "Expected failure - Firebase token validation (MOCKED AUTH)"
                self.log_test("Verify OTP (Expected Fail)", True, details)
                return True
            else:
                details = f"Unexpected response: {response.status_code} - {response.text}"
                self.log_test("Verify OTP", False, details)
                return False
                
        except Exception as e:
            self.log_test("Verify OTP", False, str(e))
            return False

    def test_create_event_without_auth(self):
        """Test event creation without proper authentication"""
        print("📅 Testing Event Creation (No Auth)")
        
        try:
            # Test without user_id parameter (should fail)
            response = self.session.post(
                f"{BASE_URL}/events",
                json=self.test_event_data,
                headers={"Content-Type": "application/json"}
            )
            
            # Should fail due to missing user_id parameter
            if response.status_code == 422:  # Validation error
                details = "Expected validation error - missing user_id parameter"
                self.log_test("Create Event (No Auth)", True, details)
                return True
            else:
                details = f"Unexpected response: {response.status_code} - {response.text}"
                self.log_test("Create Event (No Auth)", False, details)
                return False
                
        except Exception as e:
            self.log_test("Create Event (No Auth)", False, str(e))
            return False

    def create_mock_user_in_db(self):
        """Create a mock user directly in MongoDB for testing"""
        try:
            # Generate a valid ObjectId for the mock user
            mock_user_id = str(ObjectId())
            
            # Create user data
            user_data = {
                "_id": ObjectId(mock_user_id),
                "phone": self.test_phone,
                "name": self.test_name,
                "role": "admin",
                "current_event_id": None,
                "created_at": datetime.utcnow()
            }
            
            # We'll use the API to create the user indirectly by testing the database
            # For now, just use a valid ObjectId
            self.test_user_id = mock_user_id
            return True
            
        except Exception as e:
            print(f"Error creating mock user: {str(e)}")
            return False

    def test_create_event_with_mock_user(self):
        """Test event creation with mock user ID"""
        print("📅 Testing Event Creation (Mock User)")
        
        try:
            # Create a valid ObjectId for testing
            if not self.test_user_id:
                self.test_user_id = str(ObjectId())
            
            response = self.session.post(
                f"{BASE_URL}/events?user_id={self.test_user_id}",
                json=self.test_event_data,
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "event" in data:
                    self.test_event_id = data["event"]["_id"]
                    details = f"Event created: {data['event']['name']} (ID: {self.test_event_id})"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Create Event (Mock User)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Create Event (Mock User)", False, str(e))
            return False

    def test_get_events(self):
        """Test getting events for user"""
        print("📅 Testing Get Events")
        
        try:
            # Use the same mock user ID
            if not self.test_user_id:
                self.test_user_id = str(ObjectId())
            
            response = self.session.get(
                f"{BASE_URL}/events?user_id={self.test_user_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "events" in data:
                    details = f"Retrieved {len(data['events'])} events"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Events", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get Events", False, str(e))
            return False

    def test_get_specific_event(self):
        """Test getting specific event details"""
        print("📅 Testing Get Specific Event")
        
        if not self.test_event_id:
            self.log_test("Get Specific Event", False, "No test event ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BASE_URL}/events/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "event" in data:
                    event = data["event"]
                    details = f"Event: {event.get('name')} at {event.get('location')}"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Specific Event", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get Specific Event", False, str(e))
            return False

    def test_create_gift_entries(self):
        """Test creating multiple gift entries"""
        print("🎁 Testing Gift Entry Creation")
        
        if not self.test_event_id:
            self.log_test("Create Gift Entries", False, "No test event ID available")
            return False
        
        success_count = 0
        
        for i, gift_data in enumerate(self.sample_gifts):
            try:
                # Add event_id and added_by to gift data
                gift_payload = {
                    **gift_data,
                    "event_id": self.test_event_id,
                    "added_by": "test_user"
                }
                
                response = self.session.post(
                    f"{BASE_URL}/gifts",
                    json=gift_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "gift" in data:
                        self.test_gift_ids.append(data["gift"]["_id"])
                        success_count += 1
                        print(f"   ✅ Gift {i+1}: {gift_data['guest_name']} - {gift_data.get('amount', gift_data.get('item_description'))}")
                    else:
                        print(f"   ❌ Gift {i+1}: Invalid response structure")
                else:
                    print(f"   ❌ Gift {i+1}: Status {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Gift {i+1}: Exception - {str(e)}")
        
        success = success_count == len(self.sample_gifts)
        details = f"Created {success_count}/{len(self.sample_gifts)} gift entries"
        self.log_test("Create Gift Entries", success, details)
        return success

    def test_get_gifts(self):
        """Test getting all gifts for event"""
        print("🎁 Testing Get All Gifts")
        
        if not self.test_event_id:
            self.log_test("Get All Gifts", False, "No test event ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BASE_URL}/gifts/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "gifts" in data:
                    gifts = data["gifts"]
                    details = f"Retrieved {len(gifts)} gifts"
                    
                    # Show some details
                    if gifts:
                        cash_gifts = [g for g in gifts if g.get("gift_type") == "cash"]
                        item_gifts = [g for g in gifts if g.get("gift_type") == "item"]
                        total_cash = sum(g.get("amount", 0) for g in cash_gifts)
                        details += f" (Cash: {len(cash_gifts)}, Items: {len(item_gifts)}, Total: ₹{total_cash})"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get All Gifts", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get All Gifts", False, str(e))
            return False

    def test_gift_filtering(self):
        """Test gift filtering by side, type, and search"""
        print("🎁 Testing Gift Filtering")
        
        if not self.test_event_id:
            self.log_test("Gift Filtering", False, "No test event ID available")
            return False
        
        filters_tested = 0
        filters_passed = 0
        
        # Test filtering by side
        for side in ["bride", "groom"]:
            try:
                response = self.session.get(
                    f"{BASE_URL}/gifts/{self.test_event_id}?side={side}",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        gifts = data.get("gifts", [])
                        filters_passed += 1
                        print(f"   ✅ Filter by {side}: {len(gifts)} gifts")
                    else:
                        print(f"   ❌ Filter by {side}: Invalid response")
                else:
                    print(f"   ❌ Filter by {side}: Status {response.status_code}")
                filters_tested += 1
                    
            except Exception as e:
                print(f"   ❌ Filter by {side}: {str(e)}")
                filters_tested += 1
        
        # Test search functionality
        try:
            response = self.session.get(
                f"{BASE_URL}/gifts/{self.test_event_id}?search=Sita",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    gifts = data.get("gifts", [])
                    filters_passed += 1
                    print(f"   ✅ Search 'Sita': {len(gifts)} gifts")
                else:
                    print(f"   ❌ Search: Invalid response")
            else:
                print(f"   ❌ Search: Status {response.status_code}")
            filters_tested += 1
                
        except Exception as e:
            print(f"   ❌ Search: {str(e)}")
            filters_tested += 1
        
        success = filters_passed == filters_tested
        details = f"Passed {filters_passed}/{filters_tested} filter tests"
        self.log_test("Gift Filtering", success, details)
        return success

    def test_gift_detail(self):
        """Test getting specific gift details"""
        print("🎁 Testing Gift Detail")
        
        if not self.test_gift_ids:
            self.log_test("Gift Detail", False, "No test gift IDs available")
            return False
        
        try:
            gift_id = self.test_gift_ids[0]
            response = self.session.get(
                f"{BASE_URL}/gifts/detail/{gift_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "gift" in data:
                    gift = data["gift"]
                    details = f"Gift: {gift.get('guest_name')} - {gift.get('gift_type')}"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Gift Detail", success, details)
            return success
            
        except Exception as e:
            self.log_test("Gift Detail", False, str(e))
            return False

    def test_update_gift(self):
        """Test updating a gift entry"""
        print("🎁 Testing Gift Update")
        
        if not self.test_gift_ids:
            self.log_test("Gift Update", False, "No test gift IDs available")
            return False
        
        try:
            gift_id = self.test_gift_ids[0]
            update_data = {
                "notes": "Updated notes - tested by automation"
            }
            
            response = self.session.put(
                f"{BASE_URL}/gifts/{gift_id}",
                json=update_data,
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "gift" in data:
                    details = f"Updated gift notes successfully"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Gift Update", success, details)
            return success
            
        except Exception as e:
            self.log_test("Gift Update", False, str(e))
            return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("📊 Testing Dashboard Stats")
        
        if not self.test_event_id:
            self.log_test("Dashboard Stats", False, "No test event ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BASE_URL}/dashboard/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "stats" in data:
                    stats = data["stats"]
                    details = f"Total guests: {stats.get('total_guests')}, Total cash: ₹{stats.get('total_cash')}"
                    
                    # Verify stats structure
                    required_keys = ["total_guests", "total_cash", "total_items", "bride_side", "groom_side"]
                    missing_keys = [key for key in required_keys if key not in stats]
                    if missing_keys:
                        success = False
                        details += f" - Missing keys: {missing_keys}"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Dashboard Stats", success, details)
            return success
            
        except Exception as e:
            self.log_test("Dashboard Stats", False, str(e))
            return False

    def test_analytics_report(self):
        """Test analytics report with AI insights"""
        print("📈 Testing Analytics Report")
        
        if not self.test_event_id:
            self.log_test("Analytics Report", False, "No test event ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BASE_URL}/reports/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "analytics" in data:
                    analytics = data["analytics"]
                    insights = analytics.get("insights", [])
                    top_contributors = analytics.get("top_contributors", [])
                    details = f"Generated {len(insights)} insights, {len(top_contributors)} top contributors"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Analytics Report", success, details)
            return success
            
        except Exception as e:
            self.log_test("Analytics Report", False, str(e))
            return False

    def test_pdf_export(self):
        """Test PDF export functionality"""
        print("📄 Testing PDF Export")
        
        if not self.test_event_id:
            self.log_test("PDF Export", False, "No test event ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BASE_URL}/export/pdf/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "pdf_data" in data:
                    pdf_data = data["pdf_data"]
                    # Verify it's valid base64
                    try:
                        base64.b64decode(pdf_data)
                        details = f"PDF generated successfully ({len(pdf_data)} chars base64)"
                    except:
                        success = False
                        details = "Invalid base64 PDF data"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("PDF Export", success, details)
            return success
            
        except Exception as e:
            self.log_test("PDF Export", False, str(e))
            return False

    def test_excel_export(self):
        """Test Excel export functionality"""
        print("📊 Testing Excel Export")
        
        if not self.test_event_id:
            self.log_test("Excel Export", False, "No test event ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BASE_URL}/export/excel/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "excel_data" in data:
                    excel_data = data["excel_data"]
                    # Verify it's valid base64
                    try:
                        base64.b64decode(excel_data)
                        details = f"Excel generated successfully ({len(excel_data)} chars base64)"
                    except:
                        success = False
                        details = "Invalid base64 Excel data"
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Excel Export", success, details)
            return success
            
        except Exception as e:
            self.log_test("Excel Export", False, str(e))
            return False

    def test_staff_management(self):
        """Test staff management functionality"""
        print("👥 Testing Staff Management")
        
        if not self.test_event_id:
            self.log_test("Staff Management", False, "No test event ID available")
            return False
        
        staff_tests_passed = 0
        staff_tests_total = 3
        
        # Test adding staff
        try:
            staff_data = {
                "phone": "+919876543220",
                "event_id": self.test_event_id,
                "role": "staff"
            }
            
            response = self.session.post(
                f"{BASE_URL}/staff",
                json=staff_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    staff_tests_passed += 1
                    print(f"   ✅ Add Staff: Success")
                else:
                    print(f"   ❌ Add Staff: Invalid response")
            else:
                print(f"   ❌ Add Staff: Status {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Add Staff: {str(e)}")
        
        # Test getting staff list
        try:
            response = self.session.get(
                f"{BASE_URL}/staff/{self.test_event_id}",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "staff" in data:
                    staff_list = data["staff"]
                    staff_tests_passed += 1
                    print(f"   ✅ Get Staff: {len(staff_list)} staff members")
                    
                    # Store staff ID for deletion test
                    if staff_list:
                        self.test_staff_ids.append(staff_list[0]["_id"])
                else:
                    print(f"   ❌ Get Staff: Invalid response")
            else:
                print(f"   ❌ Get Staff: Status {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Get Staff: {str(e)}")
        
        # Test removing staff (if we have a staff ID)
        if self.test_staff_ids:
            try:
                staff_id = self.test_staff_ids[0]
                response = self.session.delete(
                    f"{BASE_URL}/staff/{staff_id}",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        staff_tests_passed += 1
                        print(f"   ✅ Remove Staff: Success")
                    else:
                        print(f"   ❌ Remove Staff: Invalid response")
                else:
                    print(f"   ❌ Remove Staff: Status {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Remove Staff: {str(e)}")
        else:
            print(f"   ⚠️  Remove Staff: Skipped (no staff ID)")
        
        success = staff_tests_passed >= 2  # At least add and get should work
        details = f"Passed {staff_tests_passed}/{staff_tests_total} staff tests"
        self.log_test("Staff Management", success, details)
        return success

    def test_delete_gift(self):
        """Test deleting a gift entry"""
        print("🎁 Testing Gift Deletion")
        
        if not self.test_gift_ids:
            self.log_test("Gift Deletion", False, "No test gift IDs available")
            return False
        
        try:
            # Delete the last gift we created
            gift_id = self.test_gift_ids[-1]
            response = self.session.delete(
                f"{BASE_URL}/gifts/{gift_id}",
                headers={"Content-Type": "application/json"}
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    details = f"Gift deleted successfully"
                    self.test_gift_ids.remove(gift_id)
                else:
                    success = False
                    details = f"Invalid response structure: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Gift Deletion", success, details)
            return success
            
        except Exception as e:
            self.log_test("Gift Deletion", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Chadivimpulu Wedding Gift Tracking App Backend Tests")
        print("=" * 70)
        
        # Initialize mock user
        self.create_mock_user_in_db()
        
        test_results = []
        
        # Authentication Tests
        test_results.append(self.test_auth_send_otp())
        test_results.append(self.test_auth_verify_otp())
        
        # Event Management Tests
        test_results.append(self.test_create_event_without_auth())
        test_results.append(self.test_create_event_with_mock_user())
        test_results.append(self.test_get_events())
        test_results.append(self.test_get_specific_event())
        
        # Gift Management Tests
        test_results.append(self.test_create_gift_entries())
        test_results.append(self.test_get_gifts())
        test_results.append(self.test_gift_filtering())
        test_results.append(self.test_gift_detail())
        test_results.append(self.test_update_gift())
        
        # Dashboard and Analytics Tests
        test_results.append(self.test_dashboard_stats())
        test_results.append(self.test_analytics_report())
        
        # Export Tests
        test_results.append(self.test_pdf_export())
        test_results.append(self.test_excel_export())
        
        # Staff Management Tests
        test_results.append(self.test_staff_management())
        
        # Cleanup Tests
        test_results.append(self.test_delete_gift())
        
        # Summary
        print("=" * 70)
        print("📋 TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(test_results)
        total = len(test_results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📊 Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 All tests passed! Backend is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Check the details above.")
        
        return passed, total

if __name__ == "__main__":
    tester = WeddingGiftAPITester()
    passed, total = tester.run_all_tests()