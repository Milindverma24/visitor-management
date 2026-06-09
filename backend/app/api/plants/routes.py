##################################################
# IMPORTS
##################################################

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.plant import Plant
from app.schemas.plant import PlantCreate, PlantUpdate, PlantResponse
from app.security.dependencies import get_current_user, RoleChecker
from app.security.rbac import is_plant_admin_or_above

router = APIRouter()

##################################################
# ALLOWED ROLES
##################################################

PLANT_ADMIN_ROLES = ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"]


##################################################
# GET ALL PLANTS
##################################################

@router.get("/", response_model=List[PlantResponse])
def get_plants(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Returns all plants.
    CORPORATE_SUPER_ADMIN: sees all plants.
    PLANT_ADMIN and below: sees their own plant only.
    """
    role = user.get("role", "EMPLOYEE")
    plant_id = user.get("plant_id")

    if role == "CORPORATE_SUPER_ADMIN":
        return db.query(Plant).all()
    elif plant_id:
        return db.query(Plant).filter(Plant.id == plant_id).all()
    else:
        return db.query(Plant).filter(Plant.is_active == True).all()


##################################################
# GET SINGLE PLANT
##################################################

@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


##################################################
# CREATE PLANT
# Only CORPORATE_SUPER_ADMIN can create plants
##################################################

@router.post("/", response_model=PlantResponse)
def create_plant(
    plant_data: PlantCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "CORPORATE_SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only Corporate Super Admin can create plants"
        )

    existing = db.query(Plant).filter(Plant.plant_code == plant_data.plant_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plant code already exists")

    plant = Plant(**plant_data.dict())
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


##################################################
# UPDATE PLANT
##################################################

@router.put("/{plant_id}", response_model=PlantResponse)
def update_plant(
    plant_id: int,
    plant_data: PlantUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in PLANT_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized to update plants")

    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    for key, value in plant_data.dict(exclude_unset=True).items():
        setattr(plant, key, value)

    db.commit()
    db.refresh(plant)
    return plant


##################################################
# DELETE PLANT (soft delete)
##################################################

@router.delete("/{plant_id}")
def deactivate_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "CORPORATE_SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only Corporate Super Admin can deactivate plants"
        )

    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    plant.is_active = False
    db.commit()
    return {"success": True, "message": "Plant deactivated"}
