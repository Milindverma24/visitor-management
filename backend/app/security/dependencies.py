##################################################
# IMPORTS
##################################################

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.security.auth import verify_token
from app.security.rbac import ROLE_HIERARCHY

security = HTTPBearer()


##################################################
# GET CURRENT USER
# Decodes JWT and returns the payload dict.
# Payload contains: sub, role, department_id,
# plant_id, user_id, employee_id
##################################################

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


##################################################
# ROLE CHECKER (Dependency Class)
# Usable as a FastAPI Depends() dependency.
# Checks if user role is in allowed_roles.
# Also automatically allows any role with
# higher authority than the highest allowed role.
##################################################

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        role = user.get("role", "")

        # Calculate minimum authority level from allowed roles
        min_level = min(
            ROLE_HIERARCHY.get(r, 0) for r in self.allowed_roles
        ) if self.allowed_roles else 0

        # Always allow CORPORATE_SUPER_ADMIN
        if role == "CORPORATE_SUPER_ADMIN":
            return user

        # Allow if role has sufficient authority level
        user_level = ROLE_HIERARCHY.get(role, 0)
        if user_level >= min_level and role in self.allowed_roles:
            return user

        # Explicit role check fallback
        if role in self.allowed_roles:
            return user

        raise HTTPException(
            status_code=403,
            detail=f"Access Denied. Required: {', '.join(self.allowed_roles)}"
        )