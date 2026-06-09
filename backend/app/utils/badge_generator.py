import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A5
from app.utils.timezone import to_ist, get_ist_now

def generate_badge(visit, visitor, qr_path, company_logo="app/static/company_logo.png"):

    pdf_path = f"uploads/badges/visit_{visit.id}.pdf"
    
    # We will use a custom size similar to A5 landscape but tailored for the pass aspect ratio
    # 700 width, 520 height
    width, height = 700, 520
    c = canvas.Canvas(pdf_path, pagesize=(width, height))
    
    # ---------------------------------------------------------
    # Premium Dynamic Theme Resolution based on Category/Pass Type
    # ---------------------------------------------------------
    category = (visitor.category or "VISITOR").upper()
    pass_type = (visit.pass_type or "STANDARD").upper()
    
    is_vehicle_pass = pass_type == "VENDOR_PASS" or category == "DRIVER"
    
    if is_vehicle_pass:
        bg_hex = "#FFF7ED"         # Soft Safety Orange / Amber-50
        header_bg_hex = "#0F172A"  # Dark Navy
        header_text_hex = "#FFFFFF"
        accent_hex = "#EA580C"     # Safety Orange (Orange-600)
        badge_bg_hex = "#EA580C"
        badge_text_hex = "#FFFFFF"
        badge_title = "VEHICLE PASS"
    elif "EMPLOYEE" in category or "STAFF" in category:
        bg_hex = "#F1F5F9"       # Sleek Slate-100
        header_bg_hex = "#0F172A" # Dark Navy
        header_text_hex = "#FFFFFF"
        accent_hex = "#2563EB"   # Industrial Blue
        badge_bg_hex = "#2563EB"
        badge_text_hex = "#FFFFFF"
        badge_title = category
    elif "SECURITY" in category or "GUARD" in category:
        bg_hex = "#FEF2F2"       # Soft Crimson White
        header_bg_hex = "#1E293B" # Dark Slate
        header_text_hex = "#FFFFFF"
        accent_hex = "#EF4444"   # Crimson Red
        badge_bg_hex = "#EF4444"
        badge_text_hex = "#FFFFFF"
        badge_title = category
    elif "CONTRACTOR" in category or "VENDOR" in category:
        bg_hex = "#FFFBEB"       # Soft Amber White
        header_bg_hex = "#0F172A" # Dark Navy
        header_text_hex = "#FFFFFF"
        accent_hex = "#F59E0B"   # Amber Orange
        badge_bg_hex = "#F59E0B"
        badge_text_hex = "#FFFFFF"
        badge_title = category
    else: # Default VISITOR / GUEST
        bg_hex = "#FEFCE8"       # Soft Safety Yellow White
        header_bg_hex = "#0F172A" # Dark Navy
        header_text_hex = "#FFFFFF"
        accent_hex = "#FBBF24"   # Safety Yellow
        badge_bg_hex = "#FBBF24"
        badge_text_hex = "#0F172A"
        badge_title = category

    # ---------------------------------------------------------
    # Background and Border
    # ---------------------------------------------------------
    c.setFillColor(colors.HexColor(bg_hex))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Outer Border in Accent Color
    margin = 20
    c.setStrokeColor(colors.HexColor(accent_hex))
    c.setLineWidth(2)
    c.rect(margin, margin, width - 2*margin, height - 2*margin, fill=0, stroke=1)
    
    # ---------------------------------------------------------
    # Header Banner Block
    # ---------------------------------------------------------
    banner_y = height - margin - 60
    c.setFillColor(colors.HexColor(header_bg_hex))
    c.rect(margin, banner_y, width - 2*margin, 60, fill=1, stroke=0)
    
    # Under-header Accent Strip
    c.setFillColor(colors.HexColor(accent_hex))
    c.rect(margin, banner_y - 5, width - 2*margin, 5, fill=1, stroke=0)
    
    # Draw Logo and container to make it pop
    if company_logo and os.path.exists(company_logo):
        try:
            c.setFillColor(colors.white)
            c.roundRect(margin + 15, banner_y + 10, 60, 40, 4, fill=1, stroke=0)
            c.drawImage(company_logo, margin + 20, banner_y + 12, width=50, height=36, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
    
    # Company Header Title
    c.setFillColor(colors.HexColor(header_text_hex))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(margin + 90, banner_y + 22, "INDIAN GLYCOLS LIMITED - KASHIPUR")
    
    # Category Badge Block (Top Right)
    badge_width = 120
    badge_height = 26
    badge_x = width - margin - badge_width - 15
    badge_y = banner_y + 17
    c.setFillColor(colors.HexColor(badge_bg_hex))
    c.roundRect(badge_x, badge_y, badge_width, badge_height, 6, fill=1, stroke=0)
    
    # Badge text
    c.setFillColor(colors.HexColor(badge_text_hex))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(badge_x + badge_width/2.0, badge_y + 8, badge_title)
    
    # ---------------------------------------------------------
    # Left Column Details (Labels and Values)
    # ---------------------------------------------------------
    start_y = banner_y - 30
    line_spacing = 22
    col1_x = margin + 20
    col2_x = margin + 150
    
    def draw_row(y, label, val1, extra_label=None, extra_val=None):
        # Label in Slate-600
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 10)
        c.drawString(col1_x, y, label)
        
        # Value in Dark Navy
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col2_x, y, f": {str(val1).upper()}")
        
        if extra_label and extra_val:
            c.setFillColor(colors.HexColor("#475569"))
            c.setFont("Helvetica-Bold", 10)
            c.drawString(col2_x + 180, y, extra_label)
            c.setFillColor(colors.HexColor("#0F172A"))
            c.setFont("Helvetica", 10)
            c.drawString(col2_x + 250, y, f": {str(extra_val).upper()}")
            
    created_str = to_ist(visit.created_at).strftime("%Y-%m-%d %H:%M") if visit.created_at else get_ist_now().strftime("%Y-%m-%d %H:%M")
    valid_up_to_str = to_ist(visit.valid_up_to).strftime("%Y-%m-%d %H:%M") if visit.valid_up_to else "N/A"
    name_str = f"{visitor.title or ''} {visitor.full_name}"
    
    if is_vehicle_pass:
        import re
        match = re.search(r'\[(.*?)\]', visit.purpose or '')
        vehicle_number = match.group(1) if match else "N/A"
        pure_purpose = re.sub(r'\[.*?\]\s*-\s*', '', visit.purpose or '') or "MATERIAL DELIVERY"
        
        draw_row(start_y, "Pass ID", visit.card_id or "N/A")
        draw_row(start_y - line_spacing*1, "Entry Date/Time", created_str)
        draw_row(start_y - line_spacing*2, "Driver Name", name_str)
        draw_row(start_y - line_spacing*3, "Driver Phone", visitor.phone_number, "Mob Token", visit.mobile_token_no or "N/A")
        draw_row(start_y - line_spacing*4, "Transport Co.", visitor.company or "N/A")
        
        # Highlighted Vehicle Number
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 10)
        c.drawString(col1_x, start_y - line_spacing*5, "Vehicle Number")
        c.setFillColor(colors.HexColor("#C2410C")) # Orange-700
        c.setFont("Helvetica-Bold", 12)
        c.drawString(col2_x, start_y - line_spacing*5, f": {str(vehicle_number).upper()}")
        
        draw_row(start_y - line_spacing*6, "Purpose", pure_purpose, "Destination", visit.up_to or "PLANT")
        draw_row(start_y - line_spacing*7, "To Meet", visit.host_employee or "N/A")
        draw_row(start_y - line_spacing*8, "Valid UpTo", valid_up_to_str)
        draw_row(start_y - line_spacing*9, "Accmp by", visit.accompanied_by_count or "0", "Approved", "YES")
    else:
        draw_row(start_y, "Card ID", visit.card_id or "N/A")
        draw_row(start_y - line_spacing*1, "Entry Date/Time", created_str)
        draw_row(start_y - line_spacing*2, "Name", name_str)
        draw_row(start_y - line_spacing*3, "Phone", visitor.phone_number, "Mob Token", visit.mobile_token_no or "N/A")
        draw_row(start_y - line_spacing*4, "Address", visitor.address or "N/A")
        draw_row(start_y - line_spacing*5, "Accessories", visit.accessories or "NONE")
        draw_row(start_y - line_spacing*6, "Purpose", visit.purpose or "N/A", "Destination", visit.up_to or "PLANT")
        draw_row(start_y - line_spacing*7, "To Meet", visit.host_employee or "N/A")
        draw_row(start_y - line_spacing*8, "Valid UpTo", valid_up_to_str)
        draw_row(start_y - line_spacing*9, "Accmp by", visit.accompanied_by_count or "0", "Approved", "YES")
    
    # ---------------------------------------------------------
    # Right Column: Photo & QR Code
    # ---------------------------------------------------------
    photo_size = 130
    photo_x = width - margin - photo_size - 20
    photo_y = 435 - 15 - photo_size  # 290
    
    # Draw photo box
    c.setLineWidth(2)
    c.setFillColor(colors.white)
    c.rect(photo_x, photo_y, photo_size, photo_size, fill=1, stroke=1)
    
    # Handle leading slash from DB if present
    local_photo_path = visitor.photo_path.lstrip("/") if visitor.photo_path else None
    
    if local_photo_path and os.path.exists(local_photo_path):
        try:
            c.drawImage(local_photo_path, photo_x, photo_y, width=photo_size, height=photo_size, preserveAspectRatio=True)
        except Exception:
            c.setFillColor(colors.lightgrey)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(photo_x + 35, photo_y + 60, "PHOTO")
    
    qr_size = 130
    qr_y = photo_y - 15 - qr_size  # 145
    c.setFillColor(colors.white)
    c.rect(photo_x, qr_y, qr_size, qr_size, fill=1, stroke=1)
    
    if qr_path and os.path.exists(qr_path):
        try:
            c.drawImage(qr_path, photo_x + 10, qr_y + 10, width=qr_size-20, height=qr_size-20)
        except Exception:
            pass
            
    # ---------------------------------------------------------
    # Notes & Signatures Section (Bottom)
    # ---------------------------------------------------------
    c.setLineWidth(2)
    c.line(margin, 135, width - margin, 135)
    
    # Notes (Left side)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 20, 115, "Safety Directive:")
    c.setFont("Helvetica", 9)
    
    if is_vehicle_pass:
        c.drawString(margin + 20, 98, "1. Speed limit inside the plant is strictly 10 km/h.")
        c.drawString(margin + 20, 83, "2. Vehicle must be parked in designated areas only.")
        c.drawString(margin + 20, 68, "3. Drivers must wear safety shoes & helmets in loading zones.")
        c.drawString(margin + 20, 53, "4. Do not leave the engine idling while parked.")
        c.drawString(margin + 20, 38, "")
    else:
        c.drawString(margin + 20, 98, "1. Please return the pass before leaving.")
        c.drawString(margin + 20, 83, "2. In case of emergency please call reception at '8' extn.")
        c.drawString(margin + 20, 68, "3. I am Entering in this plant at my own risk.")
        c.drawString(margin + 20, 53, "4. Strictly abide by hazardous zone mobile regulations.")
        c.drawString(margin + 20, 38, "")
        
    # Signatures (Right side, non-overlapping)
    c.setFont("Helvetica-Bold", 10)
    if is_vehicle_pass:
        c.drawString(360, 45, "Sign: Driver")
    else:
        c.drawString(360, 45, "Sign: Visitor")
    c.drawString(450, 45, "Auth")
    c.drawString(530, 45, "Host")
    
    c.drawString(600, 65, "Security")
    c.setFont("Helvetica", 9)
    c.drawString(590, 45, "OutTime: _________")

    c.save()
    return pdf_path

def generate_interview_badge(interview, qr_path, company_logo="app/static/company_logo.png"):
    pdf_path = f"uploads/badges/interview_{interview.id}.pdf"
    width, height = 700, 520
    c = canvas.Canvas(pdf_path, pagesize=(width, height))
    
    bg_hex = "#FAF5FF"         # Soft Purple White
    header_bg_hex = "#1E1B4B"  # Dark Indigo
    header_text_hex = "#FFFFFF"
    accent_hex = "#8B5CF6"     # Purple-500
    badge_bg_hex = "#8B5CF6"
    badge_text_hex = "#FFFFFF"
    badge_title = "INTERVIEW PASS"
    
    c.setFillColor(colors.HexColor(bg_hex))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    margin = 20
    c.setStrokeColor(colors.HexColor(accent_hex))
    c.setLineWidth(2)
    c.rect(margin, margin, width - 2*margin, height - 2*margin, fill=0, stroke=1)
    
    banner_y = height - margin - 60
    c.setFillColor(colors.HexColor(header_bg_hex))
    c.rect(margin, banner_y, width - 2*margin, 60, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor(accent_hex))
    c.rect(margin, banner_y - 5, width - 2*margin, 5, fill=1, stroke=0)
    
    if company_logo and os.path.exists(company_logo):
        try:
            c.setFillColor(colors.white)
            c.roundRect(margin + 15, banner_y + 10, 60, 40, 4, fill=1, stroke=0)
            c.drawImage(company_logo, margin + 20, banner_y + 12, width=50, height=36, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
            
    c.setFillColor(colors.HexColor(header_text_hex))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(margin + 90, banner_y + 22, "INDIAN GLYCOLS LIMITED - KASHIPUR")
    
    badge_width = 120
    badge_height = 26
    badge_x = width - margin - badge_width - 15
    badge_y = banner_y + 17
    c.setFillColor(colors.HexColor(badge_bg_hex))
    c.roundRect(badge_x, badge_y, badge_width, badge_height, 6, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor(badge_text_hex))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(badge_x + badge_width/2.0, badge_y + 8, badge_title)
    
    start_y = banner_y - 30
    line_spacing = 22
    col1_x = margin + 20
    col2_x = margin + 150
    
    def draw_row(y, label, val):
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 10)
        c.drawString(col1_x, y, label)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col2_x, y, f": {str(val).upper()}")
        
    date_str = interview.scheduled_time.strftime("%Y-%m-%d")
    time_str = interview.scheduled_time.strftime("%H:%M")
    
    draw_row(start_y, "Pass Number", interview.pass_number or "N/A")
    draw_row(start_y - line_spacing*1, "Approval Number", interview.approval_number or "N/A")
    draw_row(start_y - line_spacing*2, "Candidate Name", interview.candidate_name)
    draw_row(start_y - line_spacing*3, "Candidate Mobile", interview.candidate_mobile)
    draw_row(start_y - line_spacing*4, "Position Applied", interview.position)
    draw_row(start_y - line_spacing*5, "Department", interview.department)
    draw_row(start_y - line_spacing*6, "Interview Type", interview.interview_type)
    draw_row(start_y - line_spacing*7, "Date & Time", f"{date_str} {time_str}")
    draw_row(start_y - line_spacing*8, "Interviewer Name", interview.interviewer_name)
    draw_row(start_y - line_spacing*9, "Location", interview.interview_location or "N/A")
    
    photo_size = 130
    photo_x = width - margin - photo_size - 20
    photo_y = 290
    c.setLineWidth(2)
    c.setFillColor(colors.white)
    c.rect(photo_x, photo_y, photo_size, photo_size, fill=1, stroke=1)
    
    if interview.candidate_photo_path:
        local_photo_path = interview.candidate_photo_path.lstrip("/")
        if os.path.exists(local_photo_path):
            try:
                c.drawImage(local_photo_path, photo_x, photo_y, width=photo_size, height=photo_size, preserveAspectRatio=True)
            except Exception:
                pass
                
    qr_size = 130
    qr_y = 145
    c.setFillColor(colors.white)
    c.rect(photo_x, qr_y, qr_size, qr_size, fill=1, stroke=1)
    
    if qr_path and os.path.exists(qr_path):
        try:
            c.drawImage(qr_path, photo_x + 10, qr_y + 10, width=qr_size-20, height=qr_size-20)
        except Exception:
            pass
            
    c.setLineWidth(2)
    c.line(margin, 135, width - margin, 135)
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 20, 115, "Interview Guidelines:")
    c.setFont("Helvetica", 9)
    c.drawString(margin + 20, 98, "1. Please report to the reception 15 minutes before the scheduled time.")
    c.drawString(margin + 20, 83, "2. Carry your original Aadhaar and educational certificates.")
    c.drawString(margin + 20, 68, "3. Mobile phones and electronic storage devices are restricted inside plant area.")
    c.drawString(margin + 20, 53, "4. Follow safety guidelines and signs inside the premises.")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(360, 45, "Sign: Candidate")
    c.drawString(460, 45, "HR Auth")
    c.drawString(550, 45, "Interviewer")
    c.drawString(640, 45, "Security")
    
    c.save()
    return pdf_path

def generate_meeting_badge(meeting, qr_path, company_logo="app/static/company_logo.png"):
    pdf_path = f"uploads/badges/meeting_{meeting.id}.pdf"
    width, height = 700, 520
    c = canvas.Canvas(pdf_path, pagesize=(width, height))
    
    bg_hex = "#ECFEFF"         # Soft Cyan White
    header_bg_hex = "#083344"  # Dark Cyan-950
    header_text_hex = "#FFFFFF"
    accent_hex = "#06B6D4"     # Cyan-500
    badge_bg_hex = "#06B6D4"
    badge_text_hex = "#FFFFFF"
    badge_title = "MEETING PASS"
    
    c.setFillColor(colors.HexColor(bg_hex))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    margin = 20
    c.setStrokeColor(colors.HexColor(accent_hex))
    c.setLineWidth(2)
    c.rect(margin, margin, width - 2*margin, height - 2*margin, fill=0, stroke=1)
    
    banner_y = height - margin - 60
    c.setFillColor(colors.HexColor(header_bg_hex))
    c.rect(margin, banner_y, width - 2*margin, 60, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor(accent_hex))
    c.rect(margin, banner_y - 5, width - 2*margin, 5, fill=1, stroke=0)
    
    if company_logo and os.path.exists(company_logo):
        try:
            c.setFillColor(colors.white)
            c.roundRect(margin + 15, banner_y + 10, 60, 40, 4, fill=1, stroke=0)
            c.drawImage(company_logo, margin + 20, banner_y + 12, width=50, height=36, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
            
    c.setFillColor(colors.HexColor(header_text_hex))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(margin + 90, banner_y + 22, "INDIAN GLYCOLS LIMITED - KASHIPUR")
    
    badge_width = 120
    badge_height = 26
    badge_x = width - margin - badge_width - 15
    badge_y = banner_y + 17
    c.setFillColor(colors.HexColor(badge_bg_hex))
    c.roundRect(badge_x, badge_y, badge_width, badge_height, 6, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor(badge_text_hex))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(badge_x + badge_width/2.0, badge_y + 8, badge_title)
    
    start_y = banner_y - 30
    line_spacing = 22
    col1_x = margin + 20
    col2_x = margin + 150
    
    def draw_row(y, label, val):
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 10)
        c.drawString(col1_x, y, label)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col2_x, y, f": {str(val).upper()}")
        
    date_str = meeting.scheduled_time.strftime("%Y-%m-%d")
    time_str = meeting.scheduled_time.strftime("%H:%M")
    
    draw_row(start_y, "Pass Number", meeting.pass_number or "N/A")
    draw_row(start_y - line_spacing*1, "Approval Number", meeting.approval_number or "N/A")
    draw_row(start_y - line_spacing*2, "Visitor Name", meeting.visitor_name)
    draw_row(start_y - line_spacing*3, "Company Name", meeting.company_name)
    draw_row(start_y - line_spacing*4, "Visitor Phone", meeting.visitor_mobile)
    draw_row(start_y - line_spacing*5, "Meeting Title", meeting.title)
    draw_row(start_y - line_spacing*6, "Meeting Type", meeting.meeting_type)
    draw_row(start_y - line_spacing*7, "Date & Time", f"{date_str} {time_str}")
    draw_row(start_y - line_spacing*8, "Host Employee", f"{meeting.host_employee} ({meeting.host_department})")
    draw_row(start_y - line_spacing*9, "Meeting Room", meeting.location or "N/A")
    
    photo_size = 130
    photo_x = width - margin - photo_size - 20
    photo_y = 290
    c.setLineWidth(2)
    c.setFillColor(colors.white)
    c.rect(photo_x, photo_y, photo_size, photo_size, fill=1, stroke=1)
    
    if meeting.visitor_photo_path:
        local_photo_path = meeting.visitor_photo_path.lstrip("/")
        if os.path.exists(local_photo_path):
            try:
                c.drawImage(local_photo_path, photo_x, photo_y, width=photo_size, height=photo_size, preserveAspectRatio=True)
            except Exception:
                pass
                
    qr_size = 130
    qr_y = 145
    c.setFillColor(colors.white)
    c.rect(photo_x, qr_y, qr_size, qr_size, fill=1, stroke=1)
    
    if qr_path and os.path.exists(qr_path):
        try:
            c.drawImage(qr_path, photo_x + 10, qr_y + 10, width=qr_size-20, height=qr_size-20)
        except Exception:
            pass
            
    c.setLineWidth(2)
    c.line(margin, 135, width - margin, 135)
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 20, 115, "Safety Directive:")
    c.setFont("Helvetica", 9)
    c.drawString(margin + 20, 98, "1. Please keep this pass visible at all times during the meeting.")
    c.drawString(margin + 20, 83, "2. Visitor must remain accompanied by the host employee.")
    c.drawString(margin + 20, 68, "3. Photography and recording are strictly prohibited inside the premises.")
    c.drawString(margin + 20, 53, "4. Return the pass to gate security upon checkout.")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(360, 45, "Sign: Visitor")
    c.drawString(460, 45, "Auth Sign")
    c.drawString(550, 45, "Host Sign")
    c.drawString(640, 45, "Security Out")
    
    c.save()
    return pdf_path