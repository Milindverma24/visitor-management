from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.security.auth import verify_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = verify_token(token)

        return payload

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        if "SUPER_ADMIN" in self.allowed_roles and user.get("role") == "SUPER_ADMIN":
            return user
        if user.get("role") not in self.allowed_roles and user.get("role") != "SUPER_ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions"
            )
        return user