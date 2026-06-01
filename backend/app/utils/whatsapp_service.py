import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# We expect these in .env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "AC_placeholder")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "placeholder_token")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

def send_whatsapp(to_number: str, message: str):
    """
    Send a WhatsApp message using Twilio.
    Ensure to_number is in E.164 format e.g., '+919876543210'
    """
    try:
        # Avoid crashing if keys are just placeholders during development
        if TWILIO_ACCOUNT_SID == "AC_placeholder":
            print(f"Mock WhatsApp Sent to {to_number}: {message}")
            return True

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Twilio requires 'whatsapp:' prefix for the 'to' and 'from' numbers
        if not to_number.startswith('whatsapp:'):
            # assume number is just international format, add prefix
            to_number_formatted = f"whatsapp:{to_number}"
        else:
            to_number_formatted = to_number

        msg = client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=to_number_formatted
        )
        print(f"WhatsApp sent successfully. SID: {msg.sid}")
        return True
    except Exception as e:
        print(f"Failed to send WhatsApp message: {str(e)}")
        return False
