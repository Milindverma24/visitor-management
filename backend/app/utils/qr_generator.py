import qrcode
import os


def generate_qr(visit_id):



    qr_data = f"VISIT_ID:{visit_id}"

    file_path = (
        f"uploads/qrcodes/visit_{visit_id}.png"
    )

    qr = qrcode.make(qr_data)

    qr.save(file_path)

    return file_path