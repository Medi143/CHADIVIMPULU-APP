#!/usr/bin/env python3
"""
Backend API Testing for Chadivimpulu App - User Profile Endpoints
Testing the NEW User Profile API endpoints and existing Staff endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://gift-register.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
TEST_PHONE = "9999999999"
TEST_NAME = "Test Admin"
TEST_ROLE = "admin"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.test_user_id = None  # For deletion test
        self.event_id = None
        self.staff_id = None
        self.results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_data": response_data
        })
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and handle response"""
        url = f"{BACKEND_URL}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            print(f"  → {method} {url}")
            print(f"  → Status: {response.status_code}")
            
            if response.status_code == expected_status:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                try:
                    error_data = response.json()
                    return False, f"Status {response.status_code}: {error_data}"
                except:
                    return False, f"Status {response.status_code}: {response.text}"
                    
        except Exception as e:
            return False, f"Request failed: {str(e)}"
    
    def test_instant_login(self):
        """Test instant login to get user_id"""
        print("\n=== Testing Instant Login ===")
        
        login_data = {
            "phone": TEST_PHONE,
            "name": TEST_NAME,
            "role": TEST_ROLE
        }
        
        success, response = self.make_request("POST", "/auth/instant-login", login_data)
        
        if success and response.get("success"):
            self.user_id = response["user"]["_id"]
            self.log_result(
                "Instant Login",
                True,
                f"User ID: {self.user_id}",
                response
            )
            return True
        else:
            self.log_result("Instant Login", False, str(response))
            return False
    
    def test_get_user_profile(self):
        """Test GET /api/users/{user_id} - Fetch user profile"""
        print("\n=== Testing GET User Profile ===")
        
        if not self.user_id:
            self.log_result("GET User Profile", False, "No user_id available")
            return False
            
        success, response = self.make_request("GET", f"/users/{self.user_id}")
        
        if success and response.get("success"):
            user_data = response["user"]
            expected_fields = ["_id", "phone", "name", "role"]
            missing_fields = [field for field in expected_fields if field not in user_data]
            
            if not missing_fields:
                self.log_result(
                    "GET User Profile",
                    True,
                    f"Retrieved user: {user_data['name']} ({user_data['phone']})",
                    response
                )
                return True
            else:
                self.log_result(
                    "GET User Profile",
                    False,
                    f"Missing fields: {missing_fields}",
                    response
                )
                return False
        else:
            self.log_result("GET User Profile", False, str(response))
            return False
    
    def test_update_user_profile(self):
        """Test PUT /api/users/{user_id} - Update user profile"""
        print("\n=== Testing PUT User Profile ===")
        
        if not self.user_id:
            self.log_result("PUT User Profile", False, "No user_id available")
            return False
            
        update_data = {
            "name": "Updated Test Admin",
            "email": "test@chadivimpulu.com"
        }
        
        success, response = self.make_request("PUT", f"/users/{self.user_id}", update_data)
        
        if success and response.get("success"):
            updated_user = response["user"]
            if (updated_user.get("name") == update_data["name"] and 
                updated_user.get("email") == update_data["email"]):
                self.log_result(
                    "PUT User Profile",
                    True,
                    f"Updated name: {updated_user['name']}, email: {updated_user['email']}",
                    response
                )
                return True
            else:
                self.log_result(
                    "PUT User Profile",
                    False,
                    f"Update not reflected properly",
                    response
                )
                return False
        else:
            self.log_result("PUT User Profile", False, str(response))
            return False
    
    def test_create_test_user_for_deletion(self):
        """Create a separate test user for deletion test"""
        print("\n=== Creating Test User for Deletion ===")
        
        test_login_data = {
            "phone": "8888888888",
            "name": "Test Delete User",
            "role": "staff"
        }
        
        success, response = self.make_request("POST", "/auth/instant-login", test_login_data)
        
        if success and response.get("success"):
            self.test_user_id = response["user"]["_id"]
            self.log_result(
                "Create Test User for Deletion",
                True,
                f"Test User ID: {self.test_user_id}",
                response
            )
            return True
        else:
            self.log_result("Create Test User for Deletion", False, str(response))
            return False
    
    def test_delete_user_account(self):
        """Test DELETE /api/users/{user_id} - Delete user account with cascade"""
        print("\n=== Testing DELETE User Account ===")
        
        if not self.test_user_id:
            self.log_result("DELETE User Account", False, "No test_user_id available")
            return False
            
        success, response = self.make_request("DELETE", f"/users/{self.test_user_id}")
        
        if success and response.get("success"):
            # Verify user is actually deleted by trying to fetch it
            verify_success, verify_response = self.make_request("GET", f"/users/{self.test_user_id}", expected_status=404)
            
            if not verify_success:  # Should fail with 404
                self.log_result(
                    "DELETE User Account",
                    True,
                    "User deleted successfully and verified",
                    response
                )
                return True
            else:
                self.log_result(
                    "DELETE User Account",
                    False,
                    "User still exists after deletion",
                    verify_response
                )
                return False
        else:
            self.log_result("DELETE User Account", False, str(response))
            return False
    
    def test_create_event_for_staff_testing(self):
        """Create an event for staff testing"""
        print("\n=== Creating Event for Staff Testing ===")
        
        if not self.user_id:
            self.log_result("Create Event for Staff Testing", False, "No user_id available")
            return False
            
        event_data = {
            "name": "Staff Test Wedding",
            "date": "2024-12-31",
            "location": "Test Venue",
            "event_type": "wedding",
            "family_head_name": "Test Family Head",
            "bride_name": "Test Bride",
            "groom_name": "Test Groom",
            "phone_number": TEST_PHONE,
            "email": "test@example.com",
            "address": "Test Address",
            "user_id": self.user_id
        }
        
        success, response = self.make_request("POST", "/events", event_data)
        
        if success and response.get("success"):
            self.event_id = response["event"]["_id"]
            self.log_result(
                "Create Event for Staff Testing",
                True,
                f"Event ID: {self.event_id}",
                response
            )
            return True
        else:
            self.log_result("Create Event for Staff Testing", False, str(response))
            return False
    
    def test_add_staff(self):
        """Test POST /api/staff - Add staff"""
        print("\n=== Testing POST Add Staff ===")
        
        if not self.event_id:
            self.log_result("POST Add Staff", False, "No event_id available")
            return False
            
        staff_data = {
            "phone": "7777777777",
            "event_id": self.event_id,
            "role": "staff"
        }
        
        success, response = self.make_request("POST", "/staff", staff_data)
        
        if success and response.get("success"):
            self.log_result(
                "POST Add Staff",
                True,
                f"Staff added for event {self.event_id}",
                response
            )
            return True
        else:
            self.log_result("POST Add Staff", False, str(response))
            return False
    
    def test_get_staff_list(self):
        """Test GET /api/staff/{event_id} - Get staff list for event"""
        print("\n=== Testing GET Staff List ===")
        
        if not self.event_id:
            self.log_result("GET Staff List", False, "No event_id available")
            return False
            
        success, response = self.make_request("GET", f"/staff/{self.event_id}")
        
        if success and response.get("success"):
            staff_list = response["staff"]
            if len(staff_list) > 0:
                # Store staff_id for deletion test
                self.staff_id = staff_list[0]["_id"]
                self.log_result(
                    "GET Staff List",
                    True,
                    f"Retrieved {len(staff_list)} staff members",
                    response
                )
                return True
            else:
                self.log_result(
                    "GET Staff List",
                    False,
                    "No staff found in list",
                    response
                )
                return False
        else:
            self.log_result("GET Staff List", False, str(response))
            return False
    
    def test_remove_staff(self):
        """Test DELETE /api/staff/{staff_id} - Remove staff"""
        print("\n=== Testing DELETE Remove Staff ===")
        
        if not self.staff_id:
            self.log_result("DELETE Remove Staff", False, "No staff_id available")
            return False
            
        success, response = self.make_request("DELETE", f"/staff/{self.staff_id}")
        
        if success and response.get("success"):
            # Verify staff is removed by checking staff list
            verify_success, verify_response = self.make_request("GET", f"/staff/{self.event_id}")
            
            if verify_success and verify_response.get("success"):
                remaining_staff = verify_response["staff"]
                staff_still_exists = any(s["_id"] == self.staff_id for s in remaining_staff)
                
                if not staff_still_exists:
                    self.log_result(
                        "DELETE Remove Staff",
                        True,
                        "Staff removed successfully and verified",
                        response
                    )
                    return True
                else:
                    self.log_result(
                        "DELETE Remove Staff",
                        False,
                        "Staff still exists after deletion",
                        verify_response
                    )
                    return False
            else:
                self.log_result(
                    "DELETE Remove Staff",
                    False,
                    "Could not verify staff removal",
                    verify_response
                )
                return False
        else:
            self.log_result("DELETE Remove Staff", False, str(response))
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for User Profile & Staff Endpoints")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Credentials: {TEST_PHONE} / {TEST_NAME} / {TEST_ROLE}")
        
        # Test sequence
        tests = [
            self.test_instant_login,
            self.test_get_user_profile,
            self.test_update_user_profile,
            self.test_create_test_user_for_deletion,
            self.test_delete_user_account,
            self.test_create_event_for_staff_testing,
            self.test_add_staff,
            self.test_get_staff_list,
            self.test_remove_staff
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                self.log_result(test.__name__, False, f"Exception: {str(e)}")
        
        # Summary
        print(f"\n{'='*60}")
        print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        print(f"{'='*60}")
        
        # Detailed results
        for result in self.results:
            print(f"{result['status']} {result['test']}: {result['details']}")
        
        return passed, total, self.results

if __name__ == "__main__":
    tester = BackendTester()
    passed, total, results = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)