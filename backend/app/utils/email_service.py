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
    is_html=False
):

    message = MIMEMultipart()

    message["From"] = EMAIL_USER
    message["To"] = recipient_email
    message["Subject"] = subject

    if is_html:
        message.attach(MIMEText(body, "html"))
    else:
        message.attach(MIMEText(body, "plain"))

    ##################################################
    # ATTACH PDF
    ##################################################

    if attachment_path and os.path.exists(
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