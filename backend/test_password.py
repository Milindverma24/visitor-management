from app.security.password import hash_password
from app.security.password import verify_password

password = "Milind@123"

hashed = hash_password(password)

print("HASH:")
print(hashed)

print("\nVERIFY:")
print(
    verify_password(
        password,
        hashed
    )
)