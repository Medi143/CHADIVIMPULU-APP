#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Chadivimpulu Wedding Gift Tracking App
Testing the updated backend with focus on critical endpoints and data flow.
"""

import requests
import json
import base64
import sys
from datetime import datetime

# Backend URL from environment configuration
BACKEND_URL = "https://gift-register.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
TEST_PHONE = "9876543210"  # As specified in review request
TEST_NAME = "Flow Test User"  # As specified in review request
TEST_ROLE = "admin"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.user_id = None
        self.event_id = None
        self.gift_ids = []
        self.test_results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
    
    def test_instant_login(self):
        """Test instant login with specified credentials"""
        print("=== Testing Instant Login ===")
        
        try:
            payload = {
                "phone": TEST_PHONE,
                "name": TEST_NAME,
                "role": TEST_ROLE
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/instant-login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "user" in data and "token" in data:
                    self.user_token = data["token"]
                    self.user_id = data["user"]["_id"]
                    self.log_result("Instant Login", True, f"User ID: {self.user_id}, Token received")
                    return True
                else:
                    self.log_result("Instant Login", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Instant Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Instant Login", False, f"Exception: {str(e)}")
            return False
    
    def test_event_creation(self):
        """Test event creation with full fields"""
        print("=== Testing Event Creation with Extended Fields ===")
        
        try:
            payload = {
                "name": "Divya & Suresh Wedding",
                "date": "2024-02-15",
                "location": "Grand Palace, Hyderabad",
                "event_type": "wedding",
                "family_head_name": "Mr. Ramesh Kumar",
                "bride_name": "Divya",
                "groom_name": "Suresh",
                "event_person_name": "Ramesh Kumar",
                "phone_number": "9876543210",
                "email": "ramesh@example.com",
                "address": "123 Main Street, Hyderabad",
                "user_id": self.user_id
            }
            
            response = self.session.post(f"{BACKEND_URL}/events", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "event" in data:
                    self.event_id = data["event"]["_id"]
                    event = data["event"]
                    
                    # Verify all required fields are present
                    required_fields = ["event_type", "family_head_name", "bride_name", "groom_name", "phone_number", "email", "address", "code", "guest_limit"]
                    missing_fields = [field for field in required_fields if field not in event or event[field] is None]
                    
                    if missing_fields:
                        self.log_result("Event Creation", False, f"Missing fields: {missing_fields}")
                        return False
                    else:
                        self.log_result("Event Creation", True, f"Event ID: {self.event_id}, Code: {event.get('code')}")
                        return True
                else:
                    self.log_result("Event Creation", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Event Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Event Creation", False, f"Exception: {str(e)}")
            return False
    
    def test_gift_entries_with_side(self):
        """Test gift entry creation with side field and different amounts/modes"""
        print("=== Testing Gift Entry with Side Selection ===")
        
        test_gifts = [
            {
                "guest_name": "Priya Sharma",
                "area": "Jubilee Hills",
                "mobile": "9876543211",
                "side": "bride",
                "gift_type": "cash",
                "amount": 116,
                "payment_mode": "cash"
            },
            {
                "guest_name": "Rajesh Reddy",
                "area": "Banjara Hills",
                "mobile": "9876543212",
                "side": "groom",
                "gift_type": "cash",
                "amount": 516,
                "payment_mode": "upi"
            },
            {
                "guest_name": "Sunita Devi",
                "area": "Secunderabad",
                "mobile": "9876543213",
                "side": "bride",
                "gift_type": "cash",
                "amount": 2016,
                "payment_mode": "cash"
            }
        ]
        
        success_count = 0
        
        for i, gift_data in enumerate(test_gifts, 1):
            try:
                gift_data["event_id"] = self.event_id
                gift_data["added_by"] = self.user_id
                
                response = self.session.post(f"{BACKEND_URL}/gifts", json=gift_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "gift" in data:
                        gift = data["gift"]
                        gift_id = gift["_id"]
                        self.gift_ids.append(gift_id)
                        
                        # Verify side field is stored correctly
                        if gift.get("side") == gift_data["side"]:
                            self.log_result(f"Gift Entry {i} (Side: {gift_data['side']})", True, 
                                          f"Amount: ₹{gift_data['amount']}, Mode: {gift_data['payment_mode']}, S.No: {gift.get('s_no')}")
                            success_count += 1
                        else:
                            self.log_result(f"Gift Entry {i}", False, f"Side field mismatch: expected {gift_data['side']}, got {gift.get('side')}")
                    else:
                        self.log_result(f"Gift Entry {i}", False, f"Invalid response: {data}")
                else:
                    self.log_result(f"Gift Entry {i}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Gift Entry {i}", False, f"Exception: {str(e)}")
        
        return success_count == len(test_gifts)
    
    def test_gift_list_with_side_verification(self):
        """Test gift list retrieval and verify side values"""
        print("=== Testing Gift List with Side Field Verification ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/gifts/{self.event_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "gifts" in data:
                    gifts = data["gifts"]
                    
                    # Verify all gifts have side field and correct values
                    bride_count = 0
                    groom_count = 0
                    
                    for gift in gifts:
                        side = gift.get("side")
                        if side == "bride":
                            bride_count += 1
                        elif side == "groom":
                            groom_count += 1
                        else:
                            self.log_result("Gift List Side Verification", False, f"Invalid side value: {side}")
                            return False
                    
                    self.log_result("Gift List Side Verification", True, 
                                  f"Total gifts: {len(gifts)}, Bride: {bride_count}, Groom: {groom_count}")
                    return True
                else:
                    self.log_result("Gift List Side Verification", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Gift List Side Verification", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Gift List Side Verification", False, f"Exception: {str(e)}")
            return False
    
    def test_reports_with_all_entries(self):
        """Test reports endpoint for all_entries array with s_no, side, payment_mode"""
        print("=== Testing Reports with All Entries ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/reports/{self.event_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "analytics" in data and "all_entries" in data["analytics"]:
                    all_entries = data["analytics"]["all_entries"]
                    
                    if not all_entries:
                        self.log_result("Reports All Entries", False, "all_entries array is empty")
                        return False
                    
                    # Verify required fields in all_entries
                    required_fields = ["s_no", "side", "payment_mode"]
                    for entry in all_entries:
                        for field in required_fields:
                            if field not in entry:
                                self.log_result("Reports All Entries", False, f"Missing field '{field}' in entry")
                                return False
                    
                    self.log_result("Reports All Entries", True, 
                                  f"Found {len(all_entries)} entries with s_no, side, payment_mode fields")
                    return True
                else:
                    self.log_result("Reports All Entries", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Reports All Entries", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Reports All Entries", False, f"Exception: {str(e)}")
            return False
    
    def test_pdf_export(self):
        """Test PDF export with base64 validation and file naming"""
        print("=== Testing PDF Export ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/export/pdf/{self.event_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "pdf_data" in data and "file_name" in data:
                    pdf_data = data["pdf_data"]
                    file_name = data["file_name"]
                    
                    # Verify file name pattern
                    if not file_name.startswith("Chadivimpulu_") or not file_name.endswith(".pdf"):
                        self.log_result("PDF Export", False, f"Invalid file name pattern: {file_name}")
                        return False
                    
                    # Verify base64 data is valid
                    try:
                        decoded_data = base64.b64decode(pdf_data)
                        if len(decoded_data) < 100:  # PDF should be substantial
                            self.log_result("PDF Export", False, f"PDF data too small: {len(decoded_data)} bytes")
                            return False
                        
                        # Check PDF header
                        if not decoded_data.startswith(b'%PDF'):
                            self.log_result("PDF Export", False, "Invalid PDF header")
                            return False
                        
                        self.log_result("PDF Export", True, 
                                      f"File: {file_name}, Size: {len(decoded_data)} bytes, Base64 length: {len(pdf_data)}")
                        return True
                        
                    except Exception as decode_error:
                        self.log_result("PDF Export", False, f"Base64 decode error: {str(decode_error)}")
                        return False
                else:
                    self.log_result("PDF Export", False, f"Missing pdf_data or file_name: {data}")
                    return False
            else:
                self.log_result("PDF Export", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("PDF Export", False, f"Exception: {str(e)}")
            return False
    
    def test_excel_export(self):
        """Test Excel export with base64 validation and file naming"""
        print("=== Testing Excel Export ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/export/excel/{self.event_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "excel_data" in data and "file_name" in data:
                    excel_data = data["excel_data"]
                    file_name = data["file_name"]
                    
                    # Verify file name pattern
                    if not file_name.startswith("Chadivimpulu_") or not file_name.endswith(".xlsx"):
                        self.log_result("Excel Export", False, f"Invalid file name pattern: {file_name}")
                        return False
                    
                    # Verify base64 data is valid
                    try:
                        decoded_data = base64.b64decode(excel_data)
                        if len(decoded_data) < 100:  # Excel should be substantial
                            self.log_result("Excel Export", False, f"Excel data too small: {len(decoded_data)} bytes")
                            return False
                        
                        # Check Excel header (ZIP signature for .xlsx)
                        if not decoded_data.startswith(b'PK'):
                            self.log_result("Excel Export", False, "Invalid Excel header (not ZIP format)")
                            return False
                        
                        self.log_result("Excel Export", True, 
                                      f"File: {file_name}, Size: {len(decoded_data)} bytes, Base64 length: {len(excel_data)}")
                        return True
                        
                    except Exception as decode_error:
                        self.log_result("Excel Export", False, f"Base64 decode error: {str(decode_error)}")
                        return False
                else:
                    self.log_result("Excel Export", False, f"Missing excel_data or file_name: {data}")
                    return False
            else:
                self.log_result("Excel Export", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Excel Export", False, f"Exception: {str(e)}")
            return False
    
    def test_data_flow_verification(self):
        """Verify that all gift entries reference the correct event_id"""
        print("=== Testing Data Flow Verification ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/gifts/{self.event_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "gifts" in data:
                    gifts = data["gifts"]
                    
                    # Verify all gifts have correct event_id
                    for gift in gifts:
                        if gift.get("event_id") != self.event_id:
                            self.log_result("Data Flow Verification", False, 
                                          f"Gift {gift.get('_id')} has wrong event_id: {gift.get('event_id')}")
                            return False
                    
                    self.log_result("Data Flow Verification", True, 
                                  f"All {len(gifts)} gifts correctly linked to event {self.event_id}")
                    return True
                else:
                    self.log_result("Data Flow Verification", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Data Flow Verification", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Data Flow Verification", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Chadivimpulu Backend API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Credentials: {TEST_PHONE}, {TEST_NAME}, {TEST_ROLE}")
        print("=" * 60)
        
        # Test sequence as per review request
        tests = [
            ("Instant Login", self.test_instant_login),
            ("Event Creation", self.test_event_creation),
            ("Gift Entries with Side", self.test_gift_entries_with_side),
            ("Gift List Side Verification", self.test_gift_list_with_side_verification),
            ("Reports All Entries", self.test_reports_with_all_entries),
            ("PDF Export", self.test_pdf_export),
            ("Excel Export", self.test_excel_export),
            ("Data Flow Verification", self.test_data_flow_verification)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            if test_func():
                passed += 1
        
        print("=" * 60)
        print(f"🏁 TESTING COMPLETE: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("✅ ALL TESTS PASSED - Backend is working correctly!")
        else:
            print("❌ SOME TESTS FAILED - Check details above")
            
        return passed == total

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Backend testing completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Backend testing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()