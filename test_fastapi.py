from fastapi import FastAPI, APIRouter
from fastapi.testclient import TestClient

app = FastAPI()
router = APIRouter()

@router.put("/{user_id}")
def update_user(user_id: int):
    return {"user_id": user_id}

@router.put("/profile/update")
def update_profile():
    return {"status": "ok"}

app.include_router(router, prefix="/api/users")

client = TestClient(app)
response = client.put("/api/users/profile/update")
print(response.status_code)
print(response.json())
