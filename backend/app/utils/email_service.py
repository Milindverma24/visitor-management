import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# We need the verified sender email and Brevo API Key
EMAIL_USER = os.getenv("EMAIL_USER")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

def send_email(
    recipient_email,
    subject,
    body,
    attachment_path=None,
    is_html=False,
    attachment_base64=None,
    attachment_name=None
):
    if not BREVO_API_KEY:
        print("Warning: BREVO_API_KEY is not set. Cannot send email.")
        return

    url = "https://api.brevo.com/v3/smtp/email"
    
    payload = {
        "sender": {"name": "Indian Glycol Limited", "email": EMAIL_USER},
        "to": [{"email": recipient_email}],
        "subject": subject,
    }

    if is_html:
        payload["htmlContent"] = body
    else:
        payload["textContent"] = body

    attachments = []

    if attachment_base64:
        # Strip data URL prefix if present
        base64_data = attachment_base64
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
            
        attachments.append({
            "content": base64_data,
            "name": attachment_name or "visitor_pass.pdf"
        })

    elif attachment_path and os.path.exists(attachment_path):
        import base64
        with open(attachment_path, "rb") as file:
            pdf_bytes = file.read()
        
        attachments.append({
            "content": base64.b64encode(pdf_bytes).decode("utf-8"),
            "name": os.path.basename(attachment_path)
        })

    if attachments:
        payload["attachment"] = attachments

    data = json.dumps(payload).encode("utf-8")
    
    req = urllib.request.Request(url, data=data)
    req.add_header("accept", "application/json")
    req.add_header("api-key", BREVO_API_KEY)
    req.add_header("content-type", "application/json")

    try:
        response = urllib.request.urlopen(req)
        response_data = response.read().decode("utf-8")
        print(f"Email sent successfully: {response_data}")
        return response_data
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        print(f"Failed to send email via Brevo: {error_msg}")
        raise Exception(f"Brevo API error: {error_msg}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise e