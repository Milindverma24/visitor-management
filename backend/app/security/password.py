##################################################
# IMPORTS
##################################################

from passlib.context import CryptContext


##################################################
# PASSWORD CONTEXT
##################################################

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


##################################################
# HASH PASSWORD
##################################################

def hash_password(password: str):
    """
    Convert plain password into secure hash.
    """

    return pwd_context.hash(password)


##################################################
# VERIFY PASSWORD
##################################################

def verify_password(
    plain_password: str,
    hashed_password: str
):
    """
    Compare user password with stored hash.
    """

    return pwd_context.verify(
        plain_password,
        hashed_password
    )