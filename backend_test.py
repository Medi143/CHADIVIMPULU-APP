#!/usr/bin/env python3
"""
Backend Testing Script for Chadivimpulu Wedding Gift Tracking App
Focus: NEW Search Event & Remote Gift Features
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://gift-register.preview.emergentagent.com/api"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_search_events():
    """Test the new GET /api/events/search endpoint"""
    print("=" * 60)
    print("TESTING: Event Search Endpoint")
    print("=" * 60)
    
    # Test 1: Search with valid term "wedding"
    try:
        response = requests.get(f"{BACKEND_URL}/events/search", params={"q": "wedding"})
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                events = data.get("events", [])
                log_test("Search with 'wedding'", "PASS", f"Found {len(events)} events")
                
                # Verify response format for first event if exists
                if events:
                    event = events[0]
                    required_fields = ["_id", "name", "event_type", "location", "date", 
                                     "bride_name", "groom_name", "phone_masked", "guest_count"]
                    missing_fields = [field for field in required_fields if field not in event]
                    
                    if not missing_fields:
                        log_test("Event response format", "PASS", "All required fields present")
                        
                        # Check phone masking
                        phone_masked = event.get("phone_masked", "")
                        if phone_masked and phone_masked.startswith("****"):
                            log_test("Phone number masking", "PASS", f"Phone masked as: {phone_masked}")
                        else:
                            log_test("Phone number masking", "WARN", f"Phone masking format: {phone_masked}")
                    else:
                        log_test("Event response format", "FAIL", f"Missing fields: {missing_fields}")
                else:
                    log_test("Search with 'wedding'", "WARN", "No events found with 'wedding' term")
            else:
                log_test("Search with 'wedding'", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Search with 'wedding'", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Search with 'wedding'", "FAIL", f"Exception: {str(e)}")
    
    # Test 2: Search with valid term "test"
    try:
        response = requests.get(f"{BACKEND_URL}/events/search", params={"q": "test"})
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                events = data.get("events", [])
                log_test("Search with 'test'", "PASS", f"Found {len(events)} events")
                return events  # Return for use in remote gift test
            else:
                log_test("Search with 'test'", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Search with 'test'", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Search with 'test'", "FAIL", f"Exception: {str(e)}")
    
    # Test 3: Search with too short term (< 2 chars)
    try:
        response = requests.get(f"{BACKEND_URL}/events/search", params={"q": "a"})
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                events = data.get("events", [])
                if len(events) == 0:
                    log_test("Search with short term 'a'", "PASS", "Returns empty array as expected")
                else:
                    log_test("Search with short term 'a'", "FAIL", f"Should return empty but got {len(events)} events")
            else:
                log_test("Search with short term 'a'", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Search with short term 'a'", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Search with short term 'a'", "FAIL", f"Exception: {str(e)}")
    
    # Test 4: Search with empty query
    try:
        response = requests.get(f"{BACKEND_URL}/events/search", params={"q": ""})
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                events = data.get("events", [])
                if len(events) == 0:
                    log_test("Search with empty query", "PASS", "Returns empty array as expected")
                else:
                    log_test("Search with empty query", "FAIL", f"Should return empty but got {len(events)} events")
            else:
                log_test("Search with empty query", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Search with empty query", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Search with empty query", "FAIL", f"Exception: {str(e)}")
    
    # Test 5: Search without q parameter
    try:
        response = requests.get(f"{BACKEND_URL}/events/search")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                events = data.get("events", [])
                if len(events) == 0:
                    log_test("Search without q parameter", "PASS", "Returns empty array as expected")
                else:
                    log_test("Search without q parameter", "FAIL", f"Should return empty but got {len(events)} events")
            else:
                log_test("Search without q parameter", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Search without q parameter", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Search without q parameter", "FAIL", f"Exception: {str(e)}")
    
    return []

def create_test_event_if_needed():
    """Create a test event if no events exist for testing"""
    print("=" * 60)
    print("SETUP: Creating test event if needed")
    print("=" * 60)
    
    # First, try instant login to get a user
    try:
        login_data = {
            "phone": "9876543210",
            "name": "Test User",
            "role": "admin"
        }
        response = requests.post(f"{BACKEND_URL}/auth/instant-login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                user_id = data["user"]["_id"]
                log_test("Test user login", "PASS", f"User ID: {user_id}")
                
                # Create a test event
                event_data = {
                    "name": "Test Wedding Event",
                    "date": "2024-12-25",
                    "location": "Test Venue, Mumbai",
                    "event_type": "wedding",
                    "family_head_name": "Test Family Head",
                    "bride_name": "Test Bride",
                    "groom_name": "Test Groom",
                    "event_person_name": "Test Person",
                    "phone_number": "9876543210",
                    "email": "test@example.com",
                    "address": "Test Address, Mumbai",
                    "user_id": user_id
                }
                
                response = requests.post(f"{BACKEND_URL}/events", json=event_data)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        event_id = data["event"]["_id"]
                        log_test("Test event creation", "PASS", f"Event ID: {event_id}")
                        return event_id
                    else:
                        log_test("Test event creation", "FAIL", f"API returned success=false: {data}")
                else:
                    log_test("Test event creation", "FAIL", f"HTTP {response.status_code}: {response.text}")
            else:
                log_test("Test user login", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Test user login", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Test event setup", "FAIL", f"Exception: {str(e)}")
    
    return None

def test_remote_gift_entry(test_events=None):
    """Test the remote gift entry feature"""
    print("=" * 60)
    print("TESTING: Remote Gift Entry")
    print("=" * 60)
    
    # If no events from search, create a test event
    if not test_events:
        event_id = create_test_event_if_needed()
        if not event_id:
            log_test("Remote gift test setup", "FAIL", "Could not create test event")
            return
    else:
        event_id = test_events[0]["_id"]
        log_test("Using existing event for remote gift", "PASS", f"Event ID: {event_id}")
    
    # Test remote gift creation
    try:
        gift_data = {
            "event_id": event_id,
            "guest_name": "Remote Guest",
            "area": "Mumbai",
            "gift_type": "cash",
            "amount": 2016,
            "payment_mode": "upi",
            "added_by": "Remote Guest",
            "remote_gift": True,
            "side": "bride"  # Changed from "general" to "bride" as per the model
        }
        
        response = requests.post(f"{BACKEND_URL}/gifts", json=gift_data)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                gift = data.get("gift", {})
                gift_id = gift.get("_id")
                remote_flag = gift.get("remote_gift")
                
                if remote_flag is True:
                    log_test("Remote gift creation", "PASS", f"Gift ID: {gift_id}, remote_gift: {remote_flag}")
                    
                    # Verify the gift appears in the event's gift list
                    try:
                        response = requests.get(f"{BACKEND_URL}/gifts/{event_id}")
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("success"):
                                gifts = data.get("gifts", [])
                                remote_gifts = [g for g in gifts if g.get("remote_gift") is True]
                                
                                if remote_gifts:
                                    log_test("Remote gift in list", "PASS", f"Found {len(remote_gifts)} remote gifts")
                                    
                                    # Check if our specific gift is there
                                    our_gift = next((g for g in remote_gifts if g.get("guest_name") == "Remote Guest"), None)
                                    if our_gift:
                                        log_test("Specific remote gift verification", "PASS", 
                                               f"Guest: {our_gift.get('guest_name')}, Amount: ₹{our_gift.get('amount')}, Remote: {our_gift.get('remote_gift')}")
                                    else:
                                        log_test("Specific remote gift verification", "FAIL", "Our remote gift not found in list")
                                else:
                                    log_test("Remote gift in list", "FAIL", "No remote gifts found in event gift list")
                            else:
                                log_test("Remote gift in list", "FAIL", f"API returned success=false: {data}")
                        else:
                            log_test("Remote gift in list", "FAIL", f"HTTP {response.status_code}: {response.text}")
                    except Exception as e:
                        log_test("Remote gift verification", "FAIL", f"Exception: {str(e)}")
                        
                else:
                    log_test("Remote gift creation", "FAIL", f"remote_gift flag not set correctly: {remote_flag}")
            else:
                log_test("Remote gift creation", "FAIL", f"API returned success=false: {data}")
        else:
            log_test("Remote gift creation", "FAIL", f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Remote gift creation", "FAIL", f"Exception: {str(e)}")

def main():
    """Main testing function"""
    print("🎯 CHADIVIMPULU BACKEND TESTING")
    print("Focus: Search Event & Remote Gift Features")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Event Search Endpoint
    test_events = test_search_events()
    
    # Test 2: Remote Gift Entry
    test_remote_gift_entry(test_events)
    
    print("=" * 60)
    print("🏁 TESTING COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()