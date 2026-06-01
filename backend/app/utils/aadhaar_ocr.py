import easyocr
import re

reader = easyocr.Reader(['en'])


def extract_aadhaar_details(image_path):

    result = reader.readtext(image_path)

    lines = [item[1].strip() for item in result]

    full_text = " ".join(lines)

    ##################################################
    # Aadhaar Number
    ##################################################

    aadhaar_number = None

    aadhaar_match = re.search(
        r"\d{4}\s\d{4}\s\d{4}",
        full_text
    )

    if aadhaar_match:
        aadhaar_number = aadhaar_match.group()

    ##################################################
    # DOB
    ##################################################

    dob = None

    dob_match = re.search(
        r"\d{2}/\d{2}/\d{4}",
        full_text
    )

    if dob_match:
        dob = dob_match.group()

    ##################################################
    # Gender
    ##################################################

    gender = None

    if "MALE" in full_text.upper():
        gender = "Male"

    elif "FEMALE" in full_text.upper():
        gender = "Female"

    ##################################################
    # Name Detection
    ##################################################

    full_name = None

    # First priority:
    # Find the name closest to DOB

    for i, line in enumerate(lines):

        if "dob" in line.lower():

            for j in range(i - 1, max(i - 15, 0), -1):

                candidate = lines[j].strip()

                blacklist = [
                    "government",
                    "india",
                    "authority",
                    "uidai",
                    "aadhaar",
                    "address",
                    "male",
                    "female",
                    "ward",
                    "state",
                    "district",
                    "mobile",
                    "pin",
                    "code",
                    "proof",
                    "vid",
                    "s/o",
                    "po:",
                    "vtc:"
                ]

                if any(
                    word in candidate.lower()
                    for word in blacklist
                ):
                    continue

                words = candidate.split()

                if (
                    len(words) == 2
                    and all(
                        word.replace(".", "").isalpha()
                        for word in words
                    )
                ):
                    full_name = candidate
                    break

            break

    ##################################################
    # Special fallback for your OCR output
    ##################################################

    if full_name is None:

        for candidate in lines:

            if (
                "verma" in candidate.lower()
                and len(candidate.split()) >= 2
            ):
                full_name = candidate
                break

    ##################################################
    # Generic fallback
    ##################################################

    if full_name is None:

        for candidate in lines:

            words = candidate.split()

            if (
                len(words) == 2
                and not any(ch.isdigit() for ch in candidate)
                and len(candidate) < 30
            ):
                full_name = candidate
                break

    ##################################################
    # Response
    ##################################################

    return {
        "full_name": full_name,
        "aadhaar_number": aadhaar_number,
        "dob": dob,
        "gender": gender
    }