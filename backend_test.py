#!/usr/bin/env python3
"""
Backend Authentication Testing for Chadivimpulu App
Tests the 3 new authentication endpoints in sequence:
1. POST /api/auth/register - Register a new user
2. POST /api/auth/login - Login with password
3. POST /api/auth/reset-password - Reset password
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://gift-register.preview.emergentagent.com/api"

# Test credentials - using unique identifier for fresh testing
import time
unique_id = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
TEST_USER = {
    "name": "Auth Test User",
    "identifier": f"987654{unique_id}",  # Unique phone number
    "password": "Test@123",
    "new_password": "NewPass@123"
}

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_register_endpoint():
    """Test POST /api/auth/register endpoint"""
    print("=" * 60)
    print("TESTING: POST /api/auth/register")
    print("=" * 60)
    
    # Test 1: Valid registration
    try:
        payload = {
            "name": TEST_USER["name"],
            "identifier": TEST_USER["identifier"],
            "password": TEST_USER["password"]
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "Registration successful" in data.get("message", ""):
                log_test("Valid Registration", "PASS", f"Response: {data}")
            else:
                log_test("Valid Registration", "FAIL", f"Unexpected response: {data}")
                return False
        else:
            log_test("Valid Registration", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Valid Registration", "FAIL", f"Exception: {str(e)}")
        return False
    
    # Test 2: Duplicate registration (should fail)
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=payload, timeout=10)
        
        if response.status_code == 400:
            data = response.json()
            if "already exists" in data.get("detail", "").lower():
                log_test("Duplicate Registration Validation", "PASS", f"Correctly rejected: {data}")
            else:
                log_test("Duplicate Registration Validation", "FAIL", f"Wrong error message: {data}")
        else:
            log_test("Duplicate Registration Validation", "FAIL", f"Should return 400, got {response.status_code}")
            
    except Exception as e:
        log_test("Duplicate Registration Validation", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: Short name validation
    try:
        short_name_payload = {
            "name": "A",  # Too short
            "identifier": "9999999999",
            "password": "Test@123"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=short_name_payload, timeout=10)
        
        if response.status_code == 400:
            data = response.json()
            if "at least 2 characters" in data.get("detail", ""):
                log_test("Short Name Validation", "PASS", f"Correctly rejected: {data}")
            else:
                log_test("Short Name Validation", "FAIL", f"Wrong error message: {data}")
        else:
            log_test("Short Name Validation", "FAIL", f"Should return 400, got {response.status_code}")
            
    except Exception as e:
        log_test("Short Name Validation", "FAIL", f"Exception: {str(e)}")
    
    # Test 4: Short password validation
    try:
        short_password_payload = {
            "name": "Test User 2",
            "identifier": "9999999998",
            "password": "123"  # Too short
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=short_password_payload, timeout=10)
        
        if response.status_code == 400:
            data = response.json()
            if "at least 6 characters" in data.get("detail", ""):
                log_test("Short Password Validation", "PASS", f"Correctly rejected: {data}")
            else:
                log_test("Short Password Validation", "FAIL", f"Wrong error message: {data}")
        else:
            log_test("Short Password Validation", "FAIL", f"Should return 400, got {response.status_code}")
            
    except Exception as e:
        log_test("Short Password Validation", "FAIL", f"Exception: {str(e)}")
    
    return True

def test_login_endpoint():
    """Test POST /api/auth/login endpoint"""
    print("=" * 60)
    print("TESTING: POST /api/auth/login")
    print("=" * 60)
    
    # Test 1: Valid login
    try:
        payload = {
            "identifier": TEST_USER["identifier"],
            "password": TEST_USER["password"]
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                data.get("user") and 
                data.get("token") and 
                "Login successful" in data.get("message", "")):
                log_test("Valid Login", "PASS", f"User: {data['user'].get('name')}, Token: {data['token'][:20]}...")
                return data  # Return login data for further tests
            else:
                log_test("Valid Login", "FAIL", f"Missing required fields: {data}")
                return None
        else:
            log_test("Valid Login", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        log_test("Valid Login", "FAIL", f"Exception: {str(e)}")
        return None
    
    # Test 2: Wrong password
    try:
        wrong_password_payload = {
            "identifier": TEST_USER["identifier"],
            "password": "WrongPassword123"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=wrong_password_payload, timeout=10)
        
        if response.status_code == 401:
            data = response.json()
            if "password" in data.get("detail", "").lower():
                log_test("Wrong Password Validation", "PASS", f"Correctly rejected: {data}")
            else:
                log_test("Wrong Password Validation", "FAIL", f"Wrong error message: {data}")
        else:
            log_test("Wrong Password Validation", "FAIL", f"Should return 401, got {response.status_code}")
            
    except Exception as e:
        log_test("Wrong Password Validation", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: Non-existent user
    try:
        nonexistent_payload = {
            "identifier": "9999999999",  # Non-existent user
            "password": "Test@123"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=nonexistent_payload, timeout=10)
        
        if response.status_code == 401:
            data = response.json()
            if "no account found" in data.get("detail", "").lower():
                log_test("Non-existent User Validation", "PASS", f"Correctly rejected: {data}")
            else:
                log_test("Non-existent User Validation", "FAIL", f"Wrong error message: {data}")
        else:
            log_test("Non-existent User Validation", "FAIL", f"Should return 401, got {response.status_code}")
            
    except Exception as e:
        log_test("Non-existent User Validation", "FAIL", f"Exception: {str(e)}")

def test_reset_password_endpoint():
    """Test POST /api/auth/reset-password endpoint"""
    print("=" * 60)
    print("TESTING: POST /api/auth/reset-password")
    print("=" * 60)
    
    # Test 1: Valid password reset
    try:
        payload = {
            "phone": TEST_USER["identifier"],
            "new_password": TEST_USER["new_password"]
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/reset-password", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "Password updated successfully" in data.get("message", ""):
                log_test("Valid Password Reset", "PASS", f"Response: {data}")
                return True
            else:
                log_test("Valid Password Reset", "FAIL", f"Unexpected response: {data}")
                return False
        else:
            log_test("Valid Password Reset", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Valid Password Reset", "FAIL", f"Exception: {str(e)}")
        return False
    
    # Test 2: Non-existent phone number
    try:
        nonexistent_payload = {
            "phone": "9999999999",  # Non-existent phone
            "new_password": "NewPass@123"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/reset-password", json=nonexistent_payload, timeout=10)
        
        if response.status_code == 404:
            data = response.json()
            if "no account found" in data.get("detail", "").lower():
                log_test("Non-existent Phone Validation", "PASS", f"Correctly rejected: {data}")
            else:
                log_test("Non-existent Phone Validation", "FAIL", f"Wrong error message: {data}")
        else:
            log_test("Non-existent Phone Validation", "FAIL", f"Should return 404, got {response.status_code}")
            
    except Exception as e:
        log_test("Non-existent Phone Validation", "FAIL", f"Exception: {str(e)}")
    
    return True

def test_login_with_new_password():
    """Test login with the new password after reset"""
    print("=" * 60)
    print("TESTING: Login with New Password")
    print("=" * 60)
    
    try:
        payload = {
            "identifier": TEST_USER["identifier"],
            "password": TEST_USER["new_password"]  # Use new password
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                data.get("user") and 
                data.get("token") and 
                "Login successful" in data.get("message", "")):
                log_test("Login with New Password", "PASS", f"Successfully logged in with new password")
                return True
            else:
                log_test("Login with New Password", "FAIL", f"Missing required fields: {data}")
                return False
        else:
            log_test("Login with New Password", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Login with New Password", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all authentication tests in sequence"""
    print("🚀 STARTING AUTHENTICATION ENDPOINT TESTING")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User: {TEST_USER['name']} ({TEST_USER['identifier']})")
    print()
    
    # Test sequence: register → login → reset password → login with new password
    tests_passed = 0
    total_tests = 4
    
    # 1. Test registration
    if test_register_endpoint():
        tests_passed += 1
    
    # 2. Test login with original password
    login_data = test_login_endpoint()
    if login_data:
        tests_passed += 1
    
    # 3. Test password reset
    if test_reset_password_endpoint():
        tests_passed += 1
    
    # 4. Test login with new password
    if test_login_with_new_password():
        tests_passed += 1
    
    # Summary
    print("=" * 60)
    print("AUTHENTICATION TESTING SUMMARY")
    print("=" * 60)
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 ALL AUTHENTICATION TESTS PASSED!")
        return True
    else:
        print("❌ SOME AUTHENTICATION TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)