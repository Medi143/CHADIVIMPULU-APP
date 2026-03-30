#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Chadivimpulu Wedding Gift Tracking App
Tests all updated endpoints including instant login, extended event fields, auto S.No, and reports
"""

import requests
import json
import sys
from datetime import datetime

# API Base URL from frontend .env
BASE_URL = "https://gift-register.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
TEST_PHONE = "+919999999999"
TEST_NAME = "Test Admin"
TEST_ROLE = "admin"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_id = None
        self.event_id = None
        self.gift_ids = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_instant_login(self):
        """Test 1: Instant Login (Firebase Removed)"""
        self.log("Testing Instant Login...")
        
        payload = {
            "phone": TEST_PHONE,
            "name": TEST_NAME,
            "role": TEST_ROLE
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/instant-login", json=payload)
            self.log(f"Login Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "user" in data:
                    self.user_id = data["user"]["_id"]
                    self.log(f"✅ Instant Login SUCCESS - User ID: {self.user_id}")
                    self.log(f"   User: {data['user']['name']} ({data['user']['phone']})")
                    self.log(f"   Role: {data['user']['role']}")
                    return True
                else:
                    self.log(f"❌ Login failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ Login failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Login error: {str(e)}", "ERROR")
            return False
    
    def test_create_event_extended_fields(self):
        """Test 2: Create Event with Extended Fields"""
        self.log("Testing Event Creation with Extended Fields...")
        
        if not self.user_id:
            self.log("❌ Cannot test event creation - no user_id", "ERROR")
            return False
            
        payload = {
            "name": "Divya & Suresh Wedding",
            "date": "15/07/2025",
            "location": "Hyderabad",
            "event_type": "wedding",
            "family_head_name": "Rajeshwari",
            "bride_name": "Divya",
            "groom_name": "Suresh Kumar",
            "phone_number": "9573416540",
            "email": "test@test.com",
            "address": "Hyderabad",
            "user_id": self.user_id
        }
        
        try:
            response = self.session.post(f"{self.base_url}/events", json=payload)
            self.log(f"Event Creation Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "event" in data:
                    event = data["event"]
                    self.event_id = event["_id"]
                    
                    # Verify all extended fields are present
                    required_fields = [
                        "event_type", "family_head_name", "bride_name", "groom_name",
                        "phone_number", "email", "address", "code", "guest_count", "guest_limit"
                    ]
                    
                    missing_fields = []
                    for field in required_fields:
                        if field not in event:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        self.log(f"❌ Event creation missing fields: {missing_fields}")
                        return False
                    
                    self.log(f"✅ Event Creation SUCCESS - Event ID: {self.event_id}")
                    self.log(f"   Name: {event['name']}")
                    self.log(f"   Event Type: {event['event_type']}")
                    self.log(f"   Bride: {event['bride_name']}, Groom: {event['groom_name']}")
                    self.log(f"   Family Head: {event['family_head_name']}")
                    self.log(f"   Code: {event['code']}")
                    self.log(f"   Guest Limit: {event['guest_limit']}")
                    return True
                else:
                    self.log(f"❌ Event creation failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ Event creation failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Event creation error: {str(e)}", "ERROR")
            return False
    
    def test_gift_entry_auto_sno(self):
        """Test 3: Gift Entry with Auto S.No"""
        self.log("Testing Gift Entry with Auto-Increment S.No...")
        
        if not self.event_id:
            self.log("❌ Cannot test gift entry - no event_id", "ERROR")
            return False
        
        # Create 3 gift entries to test auto-increment
        test_gifts = [
            {
                "event_id": self.event_id,
                "guest_name": "Sita Ram",
                "area": "Guntur",
                "side": "bride",
                "gift_type": "cash",
                "amount": 1016,
                "payment_mode": "cash",
                "added_by": "Test Admin"
            },
            {
                "event_id": self.event_id,
                "guest_name": "Krishna Murthy",
                "area": "Vijayawada",
                "side": "groom",
                "gift_type": "cash",
                "amount": 2116,
                "payment_mode": "upi",
                "added_by": "Test Admin"
            },
            {
                "event_id": self.event_id,
                "guest_name": "Lakshmi Devi",
                "area": "Hyderabad",
                "side": "bride",
                "gift_type": "item",
                "item_description": "Silver Bowl Set",
                "payment_mode": "cash",
                "added_by": "Test Admin"
            }
        ]
        
        expected_sno = [1, 2, 3]
        success_count = 0
        
        for i, gift_data in enumerate(test_gifts):
            try:
                response = self.session.post(f"{self.base_url}/gifts", json=gift_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "gift" in data:
                        gift = data["gift"]
                        self.gift_ids.append(gift["_id"])
                        
                        # Verify S.No is auto-incremented correctly
                        if gift.get("s_no") == expected_sno[i]:
                            self.log(f"✅ Gift #{expected_sno[i]} created - {gift['guest_name']} (S.No: {gift['s_no']})")
                            success_count += 1
                            
                            # Verify area field is present
                            if "area" in gift:
                                self.log(f"   Area: {gift['area']}")
                            else:
                                self.log(f"❌ Missing 'area' field in gift entry")
                        else:
                            self.log(f"❌ Wrong S.No - Expected: {expected_sno[i]}, Got: {gift.get('s_no')}")
                    else:
                        self.log(f"❌ Gift creation failed - Invalid response: {data}")
                else:
                    self.log(f"❌ Gift creation failed - Status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log(f"❌ Gift creation error: {str(e)}", "ERROR")
        
        if success_count == 3:
            self.log("✅ All 3 gifts created with correct auto-increment S.No")
            return True
        else:
            self.log(f"❌ Only {success_count}/3 gifts created successfully")
            return False
    
    def test_reports_all_entries(self):
        """Test 4: Reports with All Entries and S.No"""
        self.log("Testing Reports with All Entries...")
        
        if not self.event_id:
            self.log("❌ Cannot test reports - no event_id", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/reports/{self.event_id}")
            self.log(f"Reports Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "analytics" in data:
                    analytics = data["analytics"]
                    
                    # Check if all_entries exists and has S.No
                    if "all_entries" in analytics:
                        all_entries = analytics["all_entries"]
                        self.log(f"✅ Reports SUCCESS - Found {len(all_entries)} entries")
                        
                        # Verify each entry has s_no
                        for entry in all_entries[:3]:  # Check first 3 entries
                            if "s_no" in entry:
                                self.log(f"   Entry S.No {entry['s_no']}: {entry['guest_name']} - {entry['area']}")
                            else:
                                self.log(f"❌ Entry missing s_no field: {entry}")
                                return False
                        
                        return True
                    else:
                        self.log(f"❌ Reports missing 'all_entries' field")
                        return False
                else:
                    self.log(f"❌ Reports failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ Reports failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Reports error: {str(e)}", "ERROR")
            return False
    
    def test_dashboard_guest_limit(self):
        """Test 5: Dashboard with Guest Limit"""
        self.log("Testing Dashboard with Guest Limit...")
        
        if not self.event_id:
            self.log("❌ Cannot test dashboard - no event_id", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/dashboard/{self.event_id}")
            self.log(f"Dashboard Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "stats" in data:
                    stats = data["stats"]
                    
                    # Check if guest_limit exists
                    if "guest_limit" in stats:
                        self.log(f"✅ Dashboard SUCCESS - Guest Limit: {stats['guest_limit']}")
                        self.log(f"   Total Guests: {stats.get('total_guests', 0)}")
                        self.log(f"   Total Cash: ₹{stats.get('total_cash', 0):,.2f}")
                        return True
                    else:
                        self.log(f"❌ Dashboard missing 'guest_limit' field")
                        return False
                else:
                    self.log(f"❌ Dashboard failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ Dashboard failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Dashboard error: {str(e)}", "ERROR")
            return False
    
    def test_gift_list_sorted_by_sno(self):
        """Test 6: Gift List sorted by S.No"""
        self.log("Testing Gift List sorted by S.No...")
        
        if not self.event_id:
            self.log("❌ Cannot test gift list - no event_id", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/gifts/{self.event_id}")
            self.log(f"Gift List Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "gifts" in data:
                    gifts = data["gifts"]
                    
                    if len(gifts) > 0:
                        # Check if gifts have s_no and are sorted
                        sno_values = [gift.get("s_no") for gift in gifts if "s_no" in gift]
                        
                        if len(sno_values) == len(gifts):
                            # Check if sorted (descending order as per API)
                            is_sorted = all(sno_values[i] >= sno_values[i+1] for i in range(len(sno_values)-1))
                            
                            if is_sorted:
                                self.log(f"✅ Gift List SUCCESS - {len(gifts)} gifts sorted by S.No (desc)")
                                for gift in gifts[:3]:  # Show first 3
                                    self.log(f"   S.No {gift['s_no']}: {gift['guest_name']}")
                                return True
                            else:
                                self.log(f"❌ Gifts not properly sorted by S.No: {sno_values}")
                                return False
                        else:
                            self.log(f"❌ Some gifts missing s_no field")
                            return False
                    else:
                        self.log(f"❌ No gifts found in list")
                        return False
                else:
                    self.log(f"❌ Gift list failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ Gift list failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Gift list error: {str(e)}", "ERROR")
            return False
    
    def test_pdf_export_with_sno(self):
        """Test 7: PDF Export with S.No"""
        self.log("Testing PDF Export with S.No...")
        
        if not self.event_id:
            self.log("❌ Cannot test PDF export - no event_id", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/export/pdf/{self.event_id}")
            self.log(f"PDF Export Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "pdf_data" in data:
                    pdf_data = data["pdf_data"]
                    
                    # Check if PDF data is base64 encoded
                    if len(pdf_data) > 100:  # Basic validation
                        self.log(f"✅ PDF Export SUCCESS - Generated {len(pdf_data)} chars of base64 data")
                        return True
                    else:
                        self.log(f"❌ PDF data too short: {len(pdf_data)} chars")
                        return False
                else:
                    self.log(f"❌ PDF export failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ PDF export failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ PDF export error: {str(e)}", "ERROR")
            return False
    
    def test_excel_export_with_sno(self):
        """Test 8: Excel Export with S.No"""
        self.log("Testing Excel Export with S.No...")
        
        if not self.event_id:
            self.log("❌ Cannot test Excel export - no event_id", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/export/excel/{self.event_id}")
            self.log(f"Excel Export Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "excel_data" in data:
                    excel_data = data["excel_data"]
                    
                    # Check if Excel data is base64 encoded
                    if len(excel_data) > 100:  # Basic validation
                        self.log(f"✅ Excel Export SUCCESS - Generated {len(excel_data)} chars of base64 data")
                        return True
                    else:
                        self.log(f"❌ Excel data too short: {len(excel_data)} chars")
                        return False
                else:
                    self.log(f"❌ Excel export failed - Invalid response: {data}")
                    return False
            else:
                self.log(f"❌ Excel export failed - Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Excel export error: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("=" * 60)
        self.log("STARTING CHADIVIMPULU BACKEND API TESTS")
        self.log("=" * 60)
        
        tests = [
            ("Instant Login (Firebase Removed)", self.test_instant_login),
            ("Event Creation with Extended Fields", self.test_create_event_extended_fields),
            ("Gift Entry with Auto S.No", self.test_gift_entry_auto_sno),
            ("Reports with All Entries", self.test_reports_all_entries),
            ("Dashboard with Guest Limit", self.test_dashboard_guest_limit),
            ("Gift List sorted by S.No", self.test_gift_list_sorted_by_sno),
            ("PDF Export with S.No", self.test_pdf_export_with_sno),
            ("Excel Export with S.No", self.test_excel_export_with_sno),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                self.log(f"❌ Test failed with exception: {str(e)}", "ERROR")
                results.append((test_name, False))
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        self.log(f"\nTotal Tests: {len(results)}")
        self.log(f"Passed: {passed}")
        self.log(f"Failed: {failed}")
        self.log(f"Success Rate: {(passed/len(results)*100):.1f}%")
        
        return passed, failed, results

def main():
    tester = BackendTester()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()