from app.models.audit_log import AuditLog


def create_audit_log(
    db,
    user_email,
    action,
    visit_id,
    ip_address
):

    log = AuditLog(
        user_email=user_email,
        action=action,
        target_id=visit_id,
        target_type="Visit",
        ip_address=ip_address
    )

    db.add(log)
    db.commit()