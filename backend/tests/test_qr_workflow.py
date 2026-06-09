import pytest
from app.models.department import Department
from app.models.visitor import Visitor
from app.models.visit import Visit

@pytest.fixture
def test_data(db_session):
    dept = Department(name="IT", code="IT_01")
    db_session.add(dept)
    db_session.commit()
    
    visitor = Visitor(full_name="Test Visitor", phone_number="9999999999", company="Test Corp", purpose="Meeting", email="test@example.com")
    db_session.add(visitor)
    db_session.commit()
    
    visit = Visit(visitor_id=visitor.id, department_id=dept.id, host_employee="Admin", purpose="Meeting", status="APPROVED", pass_type="VISITOR_PASS")
    db_session.add(visit)
    db_session.commit()
    
    # Ensure a user exists to satisfy audit log logic
    from app.models.user import User
    user = User(full_name="Test Admin", email="test@igl.com", role="PLANT_ADMIN", department_id=dept.id, is_active=True, hashed_password="hashed")
    db_session.add(user)
    db_session.commit()
    
    return {"visitor": visitor, "visit": visit, "dept": dept}

def test_checkin_success(client, test_data):
    visit_id = test_data["visit"].id
    res = client.put(f"/api/visitors/checkin/{visit_id}")
    assert res.status_code == 200
    assert res.json()["success"] == True

def test_duplicate_checkin(client, test_data):
    visit_id = test_data["visit"].id
    client.put(f"/api/visitors/checkin/{visit_id}")
    
    res = client.put(f"/api/visitors/checkin/{visit_id}")
    assert res.status_code == 400
    assert "Already Checked-In" in res.json()["detail"]

def test_checkout_without_checkin(client, test_data):
    visit_id = test_data["visit"].id
    res = client.put(f"/api/visitors/checkout/{visit_id}")
    assert res.status_code == 400
    assert "Not Checked-In" in res.json()["detail"]

def test_checkout_success(client, test_data):
    visit_id = test_data["visit"].id
    client.put(f"/api/visitors/checkin/{visit_id}")
    res = client.put(f"/api/visitors/checkout/{visit_id}")
    assert res.status_code == 200

def test_duplicate_checkout(client, test_data):
    visit_id = test_data["visit"].id
    client.put(f"/api/visitors/checkin/{visit_id}")
    client.put(f"/api/visitors/checkout/{visit_id}")
    
    res = client.put(f"/api/visitors/checkout/{visit_id}")
    assert res.status_code == 400
    assert "Already Checked-Out" in res.json()["detail"]
