import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A5
from app.utils.timezone import to_ist, get_ist_now

def generate_badge(visit, visitor, qr_path, company_logo="app/static/company_logo.png"):
    import io
    import base64

    # 700 width, 520 height logical canvas mapped to 10.6cm x 7.6cm physical badge
    from reportlab.lib.units import cm
    physical_width = 10.6 * cm
    physical_height = 7.6 * cm

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(physical_width, physical_height))

    width, height = 700, 520
    c.scale(physical_width / width, physical_height / height)
    
    # ---------------------------------------------------------
    # Premium Dynamic Theme Resolution based on Category/Pass Type
    # ---------------------------------------------------------
    category = (visitor.category or "VISITOR").upper()
    pass_type = (visit.pass_type or "STANDARD").upper()
    
    if "EMPLOYEE" in category or "STAFF" in category:
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
    
    # Handle base64 photo drawing
    if visitor.photo_path:
        try:
            if visitor.photo_path.startswith("data:image"):
                import base64
                import io
                from reportlab.lib.utils import ImageReader
                img_data = visitor.photo_path
                if "," in img_data:
                    img_data = img_data.split(",")[1]
                img_buf = io.BytesIO(base64.b64decode(img_data))
                c.drawImage(ImageReader(img_buf), photo_x, photo_y, width=photo_size, height=photo_size, preserveAspectRatio=True)
            elif os.path.exists(visitor.photo_path.lstrip("/")):
                c.drawImage(visitor.photo_path.lstrip("/"), photo_x, photo_y, width=photo_size, height=photo_size, preserveAspectRatio=True)
        except Exception as e:
            print(f"Error drawing photo on badge: {e}")
            c.setFillColor(colors.lightgrey)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(photo_x + 35, photo_y + 60, "PHOTO")
    
    qr_size = 130
    qr_y = photo_y - 15 - qr_size  # 145
    c.setFillColor(colors.white)
    c.rect(photo_x, qr_y, qr_size, qr_size, fill=1, stroke=1)
    
    # Handle base64 QR drawing
    if qr_path:
        try:
            if qr_path.startswith("data:image") or "," in qr_path or len(qr_path) > 500:
                import base64
                import io
                from reportlab.lib.utils import ImageReader
                img_data = qr_path
                if "," in img_data:
                    img_data = img_data.split(",")[1]
                img_buf = io.BytesIO(base64.b64decode(img_data))
                c.drawImage(ImageReader(img_buf), photo_x + 10, qr_y + 10, width=qr_size-20, height=qr_size-20)
            elif os.path.exists(qr_path):
                c.drawImage(qr_path, photo_x + 10, qr_y + 10, width=qr_size-20, height=qr_size-20)
        except Exception as e:
            print(f"Error drawing QR on badge: {e}")
            
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
    
    c.drawString(margin + 20, 98, "1. Please return the pass before leaving.")
    c.drawString(margin + 20, 83, "2. In case of emergency please call reception at '8' extn.")
    c.drawString(margin + 20, 68, "3. I am Entering in this plant at my own risk.")
    c.drawString(margin + 20, 53, "4. Strictly abide by hazardous zone mobile regulations.")
    c.drawString(margin + 20, 38, "")
        
    # Signatures (Right side, non-overlapping)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(360, 45, "Sign: Visitor")
    c.drawString(450, 45, "Auth")
    c.drawString(530, 45, "Host")
    
    c.drawString(600, 65, "Security")
    c.setFont("Helvetica", 9)
    c.drawString(590, 45, "OutTime: _________")

    c.save()
    pdf_bytes = buf.getvalue()
    base64_str = base64.b64encode(pdf_bytes).decode('utf-8')
    return f"data:application/pdf;base64,{base64_str}"
