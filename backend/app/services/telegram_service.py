import httpx
import os
import logging
from app.core.config import settings
from app.utils.audit import create_audit_log
from app.utils.email_service import send_email

logger = logging.getLogger(__name__)

# Constants
TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"

# Department routing mapping
DEPARTMENT_CHATS = {
    "ADMINISTRATION": settings.TELEGRAM_ADMIN_CHAT_ID,
    "SECURITY": settings.TELEGRAM_SECURITY_CHAT_ID,
    "HUMAN RESOURCES": settings.TELEGRAM_HR_CHAT_ID,
    "INFORMATION TECHNOLOGY": settings.TELEGRAM_IT_CHAT_ID,
    "PRODUCTION": settings.TELEGRAM_PRODUCTION_CHAT_ID,
    "OPERATIONS": settings.TELEGRAM_OPERATIONS_CHAT_ID,
    "MAINTENANCE": settings.TELEGRAM_MAINTENANCE_CHAT_ID,
    "SAFETY": settings.TELEGRAM_SAFETY_CHAT_ID,
    "FINANCE": settings.TELEGRAM_FINANCE_CHAT_ID,
    "SALES": settings.TELEGRAM_SALES_CHAT_ID,
    "MARKETING": settings.TELEGRAM_MARKETING_CHAT_ID,
    "LEGAL": settings.TELEGRAM_LEGAL_CHAT_ID,
    "RECEPTION": settings.TELEGRAM_RECEPTION_CHAT_ID,
}


def _get_chat_id(department: str) -> str:
    """Helper to get chat ID based on exact department name."""
    if not department:
        return None
    
    dept_upper = department.upper()
    return DEPARTMENT_CHATS.get(dept_upper, None)


def _handle_failure(db, action: str, error: Exception, fallback_subject: str, fallback_body: str):
    """Logs failure and sends email as fallback."""
    logger.error(f"Telegram failed for {action}: {error}")
    
    # Log failure
    try:
        create_audit_log(
            db=db,
            user_email="system@telegram_bot",
            action="TELEGRAM_MESSAGE_FAILED",
            visit_id=None,
            ip_address="127.0.0.1"
        )
    except Exception as e:
        logger.error(f"Failed to write to audit log: {e}")
        
    # Fallback to email
    if settings.EMAIL_USER:
        try:
            send_email(
                recipient_email=settings.EMAIL_USER,  # Sending to system admin
                subject=f"TELEGRAM FALLBACK: {fallback_subject}",
                body=fallback_body
            )
        except Exception as e:
            logger.error(f"Email fallback also failed: {e}")


def _log_success(db, action: str, target_id: int = None):
    try:
        create_audit_log(
            db=db,
            user_email="system@telegram_bot",
            action="TELEGRAM_MESSAGE_SENT",
            visit_id=target_id,
            ip_address="127.0.0.1"
        )
    except Exception as e:
        logger.error(f"Failed to log Telegram success: {e}")

def _resolve_recipient_chats(chat_id: str) -> set[str]:
    """Resolve and sanitize Telegram recipient chat IDs."""
    chats = {str(c).strip() for c in [chat_id, settings.TELEGRAM_ADMIN_CHAT_ID] if c and str(c).strip()}
    chats.discard(None)
    chats.discard("")
    return chats


def send_message(db, chat_id: str, text: str, action_name: str, target_id: int = None):
    """Base function to send a Telegram text message."""
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning(f"Telegram not configured. Skipping {action_name}.")
        return

    chat_ids = _resolve_recipient_chats(chat_id)

    for target_chat in chat_ids:
        try:
            response = httpx.post(
                f"{TELEGRAM_API_URL}/sendMessage",
                json={
                    "chat_id": target_chat,
                    "text": text,
                    "parse_mode": "HTML"
                },
                timeout=10.0
            )
            response.raise_for_status()
            _log_success(db, action_name, target_id)
        except Exception as e:
            _handle_failure(db, action_name, e, action_name, text)


def send_photo_message(db, chat_id: str, photo_path: str, caption: str, action_name: str, target_id: int = None):
    """Base function to send a Telegram photo."""
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning(f"Telegram not configured. Skipping {action_name}.")
        return
        
    if not os.path.exists(photo_path):
        logger.error(f"Photo not found at {photo_path}")
        return

    chat_ids = _resolve_recipient_chats(chat_id)

    for target_chat in chat_ids:
        try:
            with open(photo_path, "rb") as photo_file:
                files = {"photo": photo_file}
                data = {"chat_id": target_chat, "caption": caption, "parse_mode": "HTML"}
                
                response = httpx.post(
                    f"{TELEGRAM_API_URL}/sendPhoto",
                    data=data,
                    files=files,
                    timeout=15.0
                )
                response.raise_for_status()
                _log_success(db, action_name, target_id)
        except Exception as e:
            _handle_failure(db, action_name, e, action_name, caption)


def send_document_message(db, chat_id: str, document_path: str, caption: str, action_name: str, target_id: int = None):
    """Base function to send a document (e.g., PDF) to Telegram."""
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning(f"Telegram not configured. Skipping {action_name}.")
        return

    if not os.path.exists(document_path):
        logger.error(f"Document not found at {document_path}")
        return

    chat_ids = _resolve_recipient_chats(chat_id)
        
    for target_chat in chat_ids:
        try:
            with open(document_path, "rb") as doc_file:
                files = {"document": doc_file}
                data = {"chat_id": target_chat, "caption": caption, "parse_mode": "HTML"}
                
                response = httpx.post(
                    f"{TELEGRAM_API_URL}/sendDocument",
                    data=data,
                    files=files,
                    timeout=15.0
                )
                response.raise_for_status()
                _log_success(db, action_name, target_id)
        except Exception as e:
            _handle_failure(db, action_name, e, action_name, caption)


# ---------------------------------------------------------
# SPECIFIC NOTIFICATION FUNCTIONS
# ---------------------------------------------------------

def send_admin_notification(db, text: str, target_id: int = None):
    send_message(db, settings.TELEGRAM_ADMIN_CHAT_ID, text, "TELEGRAM_ADMIN_NOTIFICATION", target_id)


def send_security_notification(db, text: str, target_id: int = None):
    send_message(db, settings.TELEGRAM_SECURITY_CHAT_ID, text, "TELEGRAM_SECURITY_ALERT", target_id)


def send_hr_notification(db, text: str, target_id: int = None):
    send_message(db, settings.TELEGRAM_HR_CHAT_ID, text, "TELEGRAM_HR_NOTIFICATION", target_id)


def send_department_notification(db, department: str, text: str, target_id: int = None):
    chat_id = _get_chat_id(department)
    send_message(db, chat_id, text, f"TELEGRAM_DEPT_NOTIFICATION", target_id)


def send_visitor_photo(db, department: str, photo_path: str, name: str, purpose: str, target_id: int = None):
    chat_id = _get_chat_id(department)
    caption = f"📸 <b>NEW VISITOR PHOTO</b>\n\nName: {name}\nDepartment: {department}\nPurpose: {purpose}"
    send_photo_message(db, chat_id, photo_path, caption, "TELEGRAM_PHOTO_SENT", target_id)


def send_pass_notification(db, department: str, pass_path: str, pass_number: str, name: str, pass_type: str, target_id: int = None):
    chat_id = _get_chat_id(department)
    caption = f"🎫 <b>PASS GENERATED</b>\n\nPass Number: {pass_number}\nVisitor: {name}\nPass Type: {pass_type}\nQR Generated: Yes"
    send_document_message(db, chat_id, pass_path, caption, "TELEGRAM_PASS_SENT", target_id)
