from app.models.audit_log import AuditLog


def create_audit_log(
    db,
    user_email,
    action,
    visitor_id,
    employee_id
):

    log = AuditLog(
        user_email=user_email,
        action=action,
        target_id=visitor_id,
        target_type="Visitor",
        employee_id=employee_id
    )

    db.add(log)