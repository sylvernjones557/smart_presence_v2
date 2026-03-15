
import requests
import json

# Try to get Token
login_url = "http://localhost:8000/api/v1/login/access-token"
try:
    r = requests.post(login_url, data={"username": "admin", "password": "admin"})
    if r.status_code != 200:
        print(f"Login failed: {r.text}")
        exit()
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test Intelligent Availability (POST)
    avail_url = "http://localhost:8000/api/v1/timetable-engine/intelligent-availability"
    payload = {"day_of_week": 1, "period": 1, "subject": "Database"}
    
    # We must use POST as per our backend modification
    r = requests.post(avail_url, headers=headers, json=payload)
    print(f"Intelligent Availability Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")

    # Test Staff List and Search for a specific staff ID from the response
    if r.status_code == 200:
        data = r.json()
        recommended = data.get("recommended", [])
        if recommended:
            first_staff = recommended[0]
            print(f"Found Recommended: {first_staff['name']} (Tier: {first_staff['tier']})")
        else:
            print("No recommended staff found for 'Database'")

except Exception as e:
    print(f"Error: {e}")
