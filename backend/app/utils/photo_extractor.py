import cv2
import os


def extract_aadhaar_photo(image_path):

    image = cv2.imread(image_path)

    if image is None:
        return None

    h, w = image.shape[:2]

    # Aadhaar photo generally left side
    photo = image[
        int(h * 0.20):int(h * 0.55),
        int(w * 0.02):int(w * 0.30)
    ]



    output_path = (
        "uploads/visitor_photos/"
        + os.path.basename(image_path)
    )

    cv2.imwrite(
        output_path,
        photo
    )

    return output_path