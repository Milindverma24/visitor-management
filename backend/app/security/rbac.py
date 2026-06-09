##################################################
# IMPORTS
##################################################

from fastapi import HTTPException
from sqlalchemy.orm import Session


##################################################
# ROLE HIERARCHY
# Higher number = higher authority
##################################################

ROLE_HIERARCHY = {
    "CORPORATE_SUPER_ADMIN": 10,
    "PLANT_ADMIN":            9,
    "DEPARTMENT_HEAD":        7,
    "HR_MANAGER":             6,
    "HR_EXECUTIVE":           5,
    "DEPARTMENT_EXECUTIVE":   5,
    "RECEPTIONIST":           4,
    "SECURITY_SUPERVISOR":    3,
    "SECURITY_GUARD":         2,
    "EMPLOYEE":               1,
}

##################################################
# VALID ROLES
##################################################

VALID_ROLES = list(ROLE_HIERARCHY.keys())

##################################################
# APPROVAL AUTHORITY MAP
# Maps entity type -> list of roles that can
# grant final APPROVED status for that entity.
##################################################

APPROVER_FOR = {
    "VISIT":       ["DEPARTMENT_HEAD", "PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"],
    "INTERVIEW":   ["HR_MANAGER",      "PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"],
    "MEETING":     ["DEPARTMENT_HEAD", "PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"],
    "VENDOR":      ["DEPARTMENT_HEAD", "PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"],
    "CONTRACTOR":  ["PLANT_ADMIN",     "CORPORATE_SUPER_ADMIN"],
    "VEHICLE":     ["PLANT_ADMIN",     "CORPORATE_SUPER_ADMIN"],
}

##################################################
# CREATOR AUTHORITY MAP
# Maps entity type -> list of roles that can
# create a new request.
##################################################

CREATOR_FOR = {
    "VISIT":      [
        "RECEPTIONIST", "EMPLOYEE", "DEPARTMENT_EXECUTIVE",
        "DEPARTMENT_HEAD", "HR_MANAGER", "HR_EXECUTIVE",
        "PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"
    ],
    "INTERVIEW":  [
        "HR_EXECUTIVE", "HR_MANAGER",
        "PLANT_ADMIN",  "CORPORATE_SUPER_ADMIN"
    ],
    "MEETING":    [
        "EMPLOYEE", "RECEPTIONIST", "DEPARTMENT_EXECUTIVE",
        "DEPARTMENT_HEAD", "HR_MANAGER", "HR_EXECUTIVE",
        "PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"
    ],
    "VENDOR":     [
        "DEPARTMENT_EXECUTIVE", "DEPARTMENT_HEAD",
        "PLANT_ADMIN",          "CORPORATE_SUPER_ADMIN"
    ],
    "CONTRACTOR": [
        "DEPARTMENT_EXECUTIVE", "DEPARTMENT_HEAD",
        "PLANT_ADMIN",          "CORPORATE_SUPER_ADMIN"
    ],
    "VEHICLE":    [
        "DEPARTMENT_EXECUTIVE", "DEPARTMENT_HEAD",
        "PLANT_ADMIN",          "CORPORATE_SUPER_ADMIN"
    ],
}

##################################################
# SECURITY GATE ROLES
# Only these roles can perform Check-In / Check-Out
##################################################

GATE_ROLES = [
    "SECURITY_GUARD",
    "SECURITY_SUPERVISOR",
    "PLANT_ADMIN",
    "CORPORATE_SUPER_ADMIN",
]


##################################################
# HELPER: Get role authority level
##################################################

def get_role_level(role: str) -> int:
    return ROLE_HIERARCHY.get(role, 0)


##################################################
# HELPER: Check if role has minimum authority level
##################################################

def has_minimum_level(role: str, minimum: int) -> bool:
    return get_role_level(role) >= minimum


##################################################
# HELPER: role_required (basic list check)
# Use for simple endpoint guards
##################################################

def role_required(allowed_roles: list):
    """
    Returns a checker function that raises 403
    if the user's role is not in allowed_roles.

    Usage:
        role_required(["PLANT_ADMIN", "CORPORATE_SUPER_ADMIN"])(user)
    """
    def checker(user: dict):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied. Required roles: {', '.join(allowed_roles)}"
            )
        return True

    return checker


##################################################
# HELPER: Can approve Visit?
# DEPARTMENT_HEAD can only approve visits
# where the host department = their own department.
##################################################

def can_approve_visit(user: dict, visit, db: Session) -> bool:
    """
    Determines if the current user is authorized
    to approve a visit request.
    """
    role = user.get("role", "EMPLOYEE")

    # Corporate and Plant admins can approve any visit
    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]:
        return True

    # Department Head: must be head of host department
    if role == "DEPARTMENT_HEAD":
        return user.get("department_id") == visit.department_id

    return False


##################################################
# HELPER: Can approve Interview?
# Only HR_MANAGER (scoped to HR dept) can give
# final interview approval.
##################################################

def can_approve_interview(user: dict, interview, db: Session) -> bool:
    """
    Determines if the current user is authorized
    to approve an interview request.
    """
    role = user.get("role", "EMPLOYEE")

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]:
        return True

    if role == "HR_MANAGER":
        # HR Manager can approve any interview in their plant
        return True

    return False


##################################################
# HELPER: Can approve Meeting?
# DEPARTMENT_HEAD scoped to host department.
##################################################

def can_approve_meeting(user: dict, meeting, db: Session) -> bool:
    """
    Determines if the current user is authorized
    to approve a meeting request.
    """
    role = user.get("role", "EMPLOYEE")

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]:
        return True

    if role == "DEPARTMENT_HEAD":
        # Must be the head of the host department
        from app.models.department import Department
        dept = db.query(Department).filter(
            Department.id == user.get("department_id")
        ).first()
        if dept:
            host_dept = getattr(meeting, "host_department", "") or ""
            return dept.name.upper() == host_dept.upper()

    return False


##################################################
# HELPER: Can approve Vendor?
# DEPARTMENT_HEAD of procurement/relevant dept.
##################################################

def can_approve_vendor(user: dict, vendor, db: Session) -> bool:
    role = user.get("role", "EMPLOYEE")

    if role in ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]:
        return True

    if role == "DEPARTMENT_HEAD":
        # Department Head of vendor's target department
        dept_id = getattr(vendor, "department_id", None)
        return dept_id is not None and user.get("department_id") == dept_id

    return False


##################################################
# HELPER: Can perform gate action (check-in / out)?
##################################################

def can_perform_gate_action(user: dict) -> bool:
    return user.get("role") in GATE_ROLES


##################################################
# HELPER: Is Super Admin?
##################################################

def is_super_admin(user: dict) -> bool:
    return user.get("role") == "CORPORATE_SUPER_ADMIN"


##################################################
# HELPER: Is Plant Admin or above?
##################################################

def is_plant_admin_or_above(user: dict) -> bool:
    return get_role_level(user.get("role", "")) >= get_role_level("PLANT_ADMIN")