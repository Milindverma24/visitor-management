import httpx
import json

base_url = "http://localhost:8001"

response = httpx.post(f"{base_url}/api/auth/login", json={
    "email": "superadmin@igl.com",
    "password": "admin"
})
if response.status_code != 200:
    print("Login failed:", response.text)
    exit(1)

token = response.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}
payload = {
    "full_name": "Test Name",
    "employee_id": "1122345",
    "profile_photo_path": None
}

res = httpx.put(f"{base_url}/api/users/profile/update", json=payload, headers=headers)
print("Update Status:", res.status_code)
print("Update Response:", res.text)
