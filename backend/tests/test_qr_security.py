import pytest
from app.utils.qr_generator import generate_qr
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.models.department import Department

def test_qr_scan_resolution(client, db_session):
    # Setup
    dept = Department(name="HR", code="HR_01")
    db_session.add(dept)
    db_session.commit()
    
    visitor = Visitor(full_name="Alice QR", phone_number="9998887776", email="aliceqr@example.com", purpose="Meeting")
    db_session.add(visitor)
    db_session.commit()
    
    visit = Visit(visitor_id=visitor.id, department_id=dept.id, status="APPROVED", pass_type="VISITOR_PASS", host_employee="Admin", purpose="Meeting", card_id="VIS/2026/000001")
    db_session.add(visit)
    db_session.commit()
    
    # Mock scanning the QR code
    # As seen in qr_generator.py, the QR contains "VISIT_ID:{visit.id}"
    qr_data = f"VISIT_ID:{visit.id}"
    
    # Mock frontend request
    res = client.get(f"/api/search/latest-pass?pass_number={qr_data}")
    
    assert res.status_code == 200
    data = res.json()
    assert data["found"] == True
    assert data["pass"]["id"] == visit.id
    
    # Ensure it resolves correctly and hasn't been blocked due to mismatched fields
