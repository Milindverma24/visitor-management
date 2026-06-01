from jinja2 import Template

# Shared CSS for IGL branding
IGL_CSS = """
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%); color: white; padding: 25px 20px; text-align: center; }
    .header img { max-height: 50px; margin-bottom: 15px; background: white; padding: 5px; border-radius: 8px; }
    .header h2 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
    .content { padding: 30px 20px; line-height: 1.6; font-size: 16px; }
    .content p { margin: 0 0 15px 0; }
    .details { background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .details p { margin: 5px 0; font-size: 15px; }
    .footer { font-size: 13px; color: #64748b; text-align: center; padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer strong { color: #475569; }
"""

APPROVAL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><style>""" + IGL_CSS + """</style></head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ company_logo_url }}" alt="IGL Logo" />
            <h2>Visit Approved</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{ visitor_name }}</strong>,</p>
            <p>Your visit to India Glycols Limited has been successfully approved.</p>
            <div class="details">
                <p><strong>Date & Time:</strong> {{ visit_date }}</p>
                <p><strong>Host Employee:</strong> {{ host_name }}</p>
            </div>
            <p>We have securely generated your official <strong>Visitor Gate Pass</strong> and attached it to this email as a PDF.</p>
            <p>Please download or print the attached PDF and present the QR code at the security gate for a fast check-in experience.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>IGL Enterprise Visitor Management System</strong>.</p>
            <p>India Glycols Limited - Kashipur</p>
        </div>
    </div>
</body>
</html>
"""

CHECKIN_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><style>""" + IGL_CSS + """</style></head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ company_logo_url }}" alt="IGL Logo" />
            <h2>Welcome to IGL</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{ visitor_name }}</strong>,</p>
            <p>You have been successfully checked in at India Glycols Limited.</p>
            <div class="details">
                <p><strong>Check-In Time:</strong> {{ checkin_time }}</p>
                <p><strong>Host Employee:</strong> {{ host_name }}</p>
            </div>
            <p>Please ensure you wear your visitor badge at all times while on the premises.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>IGL Enterprise Visitor Management System</strong>.</p>
            <p>India Glycols Limited - Kashipur</p>
        </div>
    </div>
</body>
</html>
"""

CHECKOUT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><style>""" + IGL_CSS + """</style></head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ company_logo_url }}" alt="IGL Logo" />
            <h2>Thank You for Visiting</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{ visitor_name }}</strong>,</p>
            <p>You have been successfully checked out from India Glycols Limited.</p>
            <div class="details">
                <p><strong>Check-Out Time:</strong> {{ checkout_time }}</p>
            </div>
            <p>We hope you had a productive visit. Have a safe journey!</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>IGL Enterprise Visitor Management System</strong>.</p>
            <p>India Glycols Limited - Kashipur</p>
        </div>
    </div>
</body>
</html>
"""

def render_approval_email(visitor_name: str, visit_date: str, host_name: str, company_logo_url: str = "http://127.0.0.1:8001/uploads/company_logo.png") -> str:
    template = Template(APPROVAL_TEMPLATE)
    return template.render(
        visitor_name=visitor_name,
        visit_date=visit_date,
        host_name=host_name,
        company_logo_url=company_logo_url
    )

def render_checkin_email(visitor_name: str, checkin_time: str, host_name: str, company_logo_url: str = "http://127.0.0.1:8001/uploads/company_logo.png") -> str:
    template = Template(CHECKIN_TEMPLATE)
    return template.render(
        visitor_name=visitor_name,
        checkin_time=checkin_time,
        host_name=host_name,
        company_logo_url=company_logo_url
    )

def render_checkout_email(visitor_name: str, checkout_time: str, company_logo_url: str = "http://127.0.0.1:8001/uploads/company_logo.png") -> str:
    template = Template(CHECKOUT_TEMPLATE)
    return template.render(
        visitor_name=visitor_name,
        checkout_time=checkout_time,
        company_logo_url=company_logo_url
    )
