import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A5
from app.utils.timezone import to_ist, get_ist_now

def generate_badge(visit, visitor, qr_path, company_logo="uploads/company_logo.png"):

    pdf_path = f"uploads/badges/visit_{visit.id}.pdf"
    
    # We will use a custom size similar to A5 landscape but tailored for the pass aspect ratio
    # 700 width, 450 height
    width, height = 700, 480
    c = canvas.Canvas(pdf_path, pagesize=(width, height))
    
    # ---------------------------------------------------------
    # Background and Border
    # ---------------------------------------------------------
    c.setFillColor(colors.HexColor("#ffeb3b"))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Outer Border
    margin = 20
    c.setStrokeColor(colors.black)
    c.setLineWidth(2)
    c.rect(margin, margin, width - 2*margin, height - 2*margin, fill=0, stroke=1)
    
    # ---------------------------------------------------------
    # Header Section
    # ---------------------------------------------------------
    header_y = height - margin - 50
    # Draw Logo
    if company_logo and os.path.exists(company_logo):
        try:
            c.drawImage(company_logo, margin + 140, header_y, width=60, height=40, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(margin + 210, header_y + 10, "INDIA GLYCOLS LIMITED - KASHIPUR")
    
    # Header Bottom Line
    c.setLineWidth(2)
    c.line(margin, header_y - 15, width - margin, header_y - 15)
    
    # ---------------------------------------------------------
    # Left Column Details (Labels and Values)
    # ---------------------------------------------------------
    start_y = header_y - 45
    line_spacing = 22
    col1_x = margin + 20
    col2_x = margin + 150
    
    c.setFont("Helvetica-Bold", 11)
    
    def draw_row(y, label, val1, extra_label=None, extra_val=None):
        c.setFont("Helvetica", 11)
        c.drawString(col1_x, y, label)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(col2_x, y, f": {str(val1).upper()}")
        
        if extra_label and extra_val:
            c.setFont("Helvetica-Bold", 11)
            c.drawString(col2_x + 200, y, extra_label)
            c.setFont("Helvetica", 11)
            c.drawString(col2_x + 280, y, f": {str(extra_val).upper()}")
            
    created_str = to_ist(visit.created_at).strftime("%Y-%m-%d %H:%M") if visit.created_at else get_ist_now().strftime("%Y-%m-%d %H:%M")
    valid_up_to_str = to_ist(visit.valid_up_to).strftime("%Y-%m-%d %H:%M") if visit.valid_up_to else "N/A"
    name_str = f"{visitor.title or ''} {visitor.full_name} ({visitor.category or 'VISITOR'})"
    
    draw_row(start_y, "Card ID", visit.card_id or "N/A")
    draw_row(start_y - line_spacing*1, "Entry Date/Time", created_str)
    draw_row(start_y - line_spacing*2, "Name", name_str)
    draw_row(start_y - line_spacing*3, "Phone", visitor.phone_number, "Mob Token", visit.mobile_token_no or "N/A")
    draw_row(start_y - line_spacing*4, "Address", visitor.address or "N/A")
    draw_row(start_y - line_spacing*5, "Accessories", visit.accessories or "NONE")
    draw_row(start_y - line_spacing*6, "Purpose", visit.purpose or "N/A", "Destination", visit.up_to or visit.department_id or "PLANT")
    draw_row(start_y - line_spacing*7, "To Meet", visit.host_employee or "N/A")
    draw_row(start_y - line_spacing*8, "Valid UpTo", valid_up_to_str)
    draw_row(start_y - line_spacing*9, "Accmp by", visit.accompanied_by_count or "0", "Approved", "YES")
    
    # ---------------------------------------------------------
    # Right Column: Photo & QR Code
    # ---------------------------------------------------------
    photo_x = width - margin - 180
    photo_y = start_y - 120
    photo_size = 140
    
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
            c.drawString(photo_x + 40, photo_y + 65, "PHOTO")
    
    qr_y = photo_y - photo_size - 20
    c.setFillColor(colors.white)
    c.rect(photo_x, qr_y, photo_size, photo_size, fill=1, stroke=1)
    
    if qr_path and os.path.exists(qr_path):
        try:
            c.drawImage(qr_path, photo_x + 10, qr_y + 10, width=photo_size-20, height=photo_size-20)
        except Exception:
            pass
            
    # ---------------------------------------------------------
    # Notes & Signatures Section (Bottom)
    # ---------------------------------------------------------
    notes_y = margin + 70
    c.setLineWidth(2)
    c.line(margin, notes_y + 10, width - margin, notes_y + 10)
    
    # Notes
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 20, notes_y - 10, "Note:")
    c.setFont("Helvetica", 9)
    notes = [
        "1. Please return the pass before leaving.",
        "2. In case of emergency please call reception at '8' extn.",
        "3. I am Entering in this plant at my own risk.",
        "4. It has been told where to use the mobile phone and where not to use it."
    ]
    ny = notes_y - 25
    for note in notes:
        c.drawString(margin + 20, ny, note)
        ny -= 12
        
    # Signatures
    sig_y = margin + 15
    c.setFont("Helvetica-Bold", 11)
    c.drawString(width - 400, sig_y, "Sign: Visitor")
    c.drawString(width - 300, sig_y, "Auth")
    c.drawString(width - 220, sig_y, "Host")
    
    c.drawString(width - 120, sig_y + 20, "Security")
    c.setFont("Helvetica", 9)
    c.drawString(width - 130, sig_y, "OutTime: _________")

    c.save()
    return pdf_path