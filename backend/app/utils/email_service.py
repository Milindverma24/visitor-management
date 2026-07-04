import os
import smtplib

from dotenv import load_dotenv

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_email(
    recipient_email,
    subject,
    body,
    attachment_path=None,
    is_html=False,
    attachment_base64=None,
    attachment_name=None
):

    import email.utils
    message = MIMEMultipart()

    message["From"] = f"Indian Glycol Limited <{EMAIL_USER}>"
    message["To"] = recipient_email
    message["Subject"] = subject
    message["Message-ID"] = email.utils.make_msgid()
    message["Date"] = email.utils.formatdate(localtime=True)

    if is_html:
        message.attach(MIMEText(body, "html"))
    else:
        message.attach(MIMEText(body, "plain"))

    ##################################################
    # ATTACH PDF
    ##################################################

    if attachment_base64:
        import base64
        try:
            base64_data = attachment_base64
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            pdf_bytes = base64.b64decode(base64_data)
            
            part = MIMEApplication(
                pdf_bytes,
                Name=attachment_name or "visitor_pass.pdf"
            )
            part["Content-Disposition"] = f'attachment; filename="{attachment_name or "visitor_pass.pdf"}"'
            message.attach(part)
        except Exception as e:
            print(f"Failed to attach base64 pdf: {e}")

    elif attachment_path and os.path.exists(
        attachment_path
    ):

        with open(
            attachment_path,
            "rb"
        ) as file:

            part = MIMEApplication(
                file.read(),
                Name=os.path.basename(
                    attachment_path
                )
            )

        part[
            "Content-Disposition"
        ] = (
            f'attachment; filename="{os.path.basename(attachment_path)}"'
        )

        message.attach(part)

    ##################################################

    server = smtplib.SMTP(
        "smtp.gmail.com",
        587
    )

    server.starttls()

    server.login(
        EMAIL_USER,
        EMAIL_PASSWORD
    )

    server.sendmail(
        EMAIL_USER,
        recipient_email,
        message.as_string()
    )

    server.quit()