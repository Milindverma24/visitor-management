import qrcode
import io
import base64

def generate_qr(visit_id):
    qr_data = f"VISIT_ID:{visit_id}"
    qr = qrcode.make(qr_data)
    img_byte_arr = io.BytesIO()
    qr.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    base64_str = base64.b64encode(img_byte_arr).decode('utf-8')
    return f"data:image/png;base64,{base64_str}"