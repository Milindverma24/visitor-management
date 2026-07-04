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
            <p>Your visit to Indian Glycol Limited has been successfully approved.</p>
            <div class="details">
                <p><strong>Date & Time:</strong> {{ visit_date }}</p>
                <p><strong>Host Employee:</strong> {{ host_name }}</p>
            </div>
            <p>We have securely generated your official <strong>Visitor Gate Pass</strong> and attached it to this email as a PDF.</p>
            <p>Please download or print the attached PDF and present the QR code at the security gate for a fast check-in experience.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>IGL Enterprise Visitor Management System</strong>.</p>
            <p>Indian Glycol Limited - Kashipur</p>
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
            <p>You have been successfully checked in at Indian Glycol Limited.</p>
            <div class="details">
                <p><strong>Check-In Time:</strong> {{ checkin_time }}</p>
                <p><strong>Host Employee:</strong> {{ host_name }}</p>
            </div>
            <p>Please ensure you wear your visitor badge at all times while on the premises.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>IGL Enterprise Visitor Management System</strong>.</p>
            <p>Indian Glycol Limited - Kashipur</p>
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
            <p>You have been successfully checked out from Indian Glycol Limited.</p>
            <div class="details">
                <p><strong>Check-Out Time:</strong> {{ checkout_time }}</p>
            </div>
            <p>We hope you had a productive visit. Have a safe journey!</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>IGL Enterprise Visitor Management System</strong>.</p>
            <p>Indian Glycol Limited - Kashipur</p>
        </div>
    </div>
</body>
</html>
"""

def render_approval_email(visitor_name: str, visit_date: str, host_name: str, company_logo_url: str = "https://res.cloudinary.com/dngurjsdw/image/upload/v1780343367/logo1_1_giuuki.png") -> str:
    template = Template(APPROVAL_TEMPLATE)
    return template.render(
        visitor_name=visitor_name,
        visit_date=visit_date,
        host_name=host_name,
        company_logo_url=company_logo_url
    )

def render_checkin_email(visitor_name: str, checkin_time: str, host_name: str, company_logo_url: str = "https://res.cloudinary.com/dngurjsdw/image/upload/v1780343367/logo1_1_giuuki.png") -> str:
    template = Template(CHECKIN_TEMPLATE)
    return template.render(
        visitor_name=visitor_name,
        checkin_time=checkin_time,
        host_name=host_name,
        company_logo_url=company_logo_url
    )

def render_checkout_email(visitor_name: str, checkout_time: str, company_logo_url: str = "https://res.cloudinary.com/dngurjsdw/image/upload/v1780343367/logo1_1_giuuki.png") -> str:
    template = Template(CHECKOUT_TEMPLATE)
    return template.render(
        visitor_name=visitor_name,
        checkout_time=checkout_time,
        company_logo_url=company_logo_url
    )

APPROVAL_REQUEST_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        """ + IGL_CSS + """
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; margin: 0 10px; color: white !important; }
        .btn-approve { background-color: #10b981; }
        .btn-reject { background-color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ company_logo_url }}" alt="Logo" />
            <h2>Visitor Approval Request</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{ employee_name }}</strong>,</p>
            <p>A new visitor request has been submitted and requires your action.</p>
            
            <div class="details">
                <p><strong>Visitor Name:</strong> {{ visitor_name }}</p>
                <p><strong>Contact Number:</strong> {{ mobile_number }}</p>
                <p><strong>Organization:</strong> {{ organization }}</p>
                <p><strong>Purpose of Visit:</strong> {{ purpose }}</p>
                <p><strong>Date of Visit:</strong> {{ visit_date }}</p>
                <p><strong>Department:</strong> {{ department }}</p>
            </div>
            
            <p>Please review the request and choose one of the following actions:</p>
            
            <div class="action-buttons">
                <a href="{{ approve_url }}" class="btn btn-approve">APPROVE REQUEST</a>
                <a href="{{ reject_url }}" class="btn btn-reject">REJECT REQUEST</a>
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 15px; text-align: left;">
                <strong>If the buttons above are not clickable:</strong><br>
                Copy and paste the corresponding link below into your browser address bar:<br><br>
                <strong>Approve:</strong><br>
                <span style="word-break: break-all; font-family: monospace; font-size: 11px; color: #2563eb;">{{ approve_url }}</span><br><br>
                <strong>Reject:</strong><br>
                <span style="word-break: break-all; font-family: monospace; font-size: 11px; color: #dc2626;">{{ reject_url }}</span>
            </p>
        </div>
        <div class="footer">
            <p>This is an automated message from the <strong>Visitor Management System</strong>.</p>
        </div>
    </div>
</body>
</html>
"""

def render_approval_request_email(
    employee_name: str,
    visitor_name: str,
    mobile_number: str,
    organization: str,
    purpose: str,
    visit_date: str,
    department: str,
    approve_url: str,
    reject_url: str,
    company_logo_url: str = "https://res.cloudinary.com/dngurjsdw/image/upload/v1780343367/logo1_1_giuuki.png"
) -> str:
    template = Template(APPROVAL_REQUEST_TEMPLATE)
    return template.render(
        employee_name=employee_name,
        visitor_name=visitor_name,
        mobile_number=mobile_number,
        organization=organization,
        purpose=purpose,
        visit_date=visit_date,
        department=department,
        approve_url=approve_url,
        reject_url=reject_url,
        company_logo_url=company_logo_url
    )
