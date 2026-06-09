import pytest
from app.utils.qr_generator import generate_qr
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.models.department import Department
import os

def test_generate_visitor_qr(db_session):
    # Setup
    dept = Department(name="HR", code="HR_01")
    db_session.add(dept)
    db_session.commit()
    
    visitor = Visitor(full_name="Alice", phone_number="1234567890", email="alice@example.com", purpose="Meeting")
    db_session.add(visitor)
    db_session.commit()
    
    visit = Visit(visitor_id=visitor.id, department_id=dept.id, status="APPROVED", pass_type="VISITOR_PASS", host_employee="Admin", purpose="Meeting")
    db_session.add(visit)
    db_session.commit()
    
    # Generate QR
    qr_path = generate_qr(visit.id)
    
    # Validate Output
    assert qr_path.startswith("uploads/qrcodes/")
    assert qr_path.endswith(f"_{visit.id}.png")
    assert os.path.exists(qr_path)
    
    # Decode QR to ensure content security (no PII plaintext, only Visit ID encoded)
    import cv2
    img = cv2.imread(qr_path)
    detector = cv2.QRCodeDetector()
    data, bbox, straight_qrcode = detector.detectAndDecode(img)
    
    assert data == f"VISIT_ID:{visit.id}"
    
    # Clean up
    if os.path.exists(qr_path):
        os.remove(qr_path)
