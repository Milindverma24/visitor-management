from pydantic import BaseModel


class VisitorCreate(BaseModel):

    full_name: str
    phone_number: str

    email: str | None = None
    company: str | None = None
    
    title: str | None = None
    address: str | None = None
    category: str | None = None

    purpose: str

    id_type: str | None = None
    id_number: str | None = None
    
    photo_base64: str | None = None