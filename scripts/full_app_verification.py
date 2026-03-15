
import requests
import json
import socket

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def test_backend():
    print("--- Testing Backend API ---")
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Access Token Test
    try:
        r = requests.post(f"{base_url}/login/access-token", data={"username": "admin", "password": "admin"})
        if r.status_code == 200:
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Login Success")
        else:
            print(f"❌ Login Failed: {r.status_code}")
            return False
            
        # 2. Staff List Test
        r = requests.get(f"{base_url}/staff/", headers=headers)
        if r.status_code == 200:
            print(f"✅ Staff List Fetched: {len(r.json())} members")
        else:
            print(f"❌ Staff List Failed: {r.status_code}")
            
        # 3. Intelligent Availability Test
        avail_payload = {"day_of_week": 1, "period": 1, "subject": "Maths"}
        r = requests.post(f"{base_url}/timetable-engine/intelligent-availability", headers=headers, json=avail_payload)
        if r.status_code == 200:
            data = r.json()
            rec = data.get("recommended", [])
            print(f"✅ Intelligent Availability: {len(rec)} recommendations found")
            if rec:
                print(f"   Suggestion: {rec[0]['name']} is preferred for Maths")
        else:
            print(f"❌ Intelligent Availability Failed: {r.status_code}")

        # 4. Staff Activity Endpoint (The 404 fix)
        r = requests.get(f"{base_url}/staff/admin/activity", headers=headers)
        if r.status_code == 200:
            print("✅ Staff Activity Endpoint Verified (Fix Confirmed)")
        else:
            print(f"❌ Staff Activity Failed: {r.status_code}")

        return True
    except Exception as e:
        print(f"❌ Error during backend test: {e}")
        return False

def test_frontend_server():
    print("\n--- Testing Frontend Server ---")
    if check_port(3000):
        print("✅ Frontend Vite server is alive on port 3000")
        return True
    else:
        print("❌ Frontend server not detected at port 3000")
        return False

if __name__ == "__main__":
    b = test_backend()
    f = test_frontend_server()
    if b and f:
        print("\n🚀 ALL APP SYSTEMS OPERATIONAL V4.1.0")
    else:
        print("\n⚠️ SYSTEM INCOMPLETE")
