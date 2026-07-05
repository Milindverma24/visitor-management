##################################################
# IMPORTS
##################################################

import bcrypt
# Workaround for passlib bcrypt version parsing issue on Python 3.12+
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = About()

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