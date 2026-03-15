
import requests
import json

# Try to get Token
login_url = "http://localhost:8000/api/v1/login/access-token"
r = requests.post(login_url, data={"username": "admin", "password": "admin"})
if r.status_code != 200:
    print(f"Login failed: {r.text}")
    exit()

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Check availability
avail_url = "http://localhost:8000/api/v1/timetable-engine/intelligent-availability"
data = {"day_of_week": 1, "period": 1, "subject": "MATHEMATICS"}
r = requests.post(avail_url, headers=headers, json=data)

print(f"Status: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
