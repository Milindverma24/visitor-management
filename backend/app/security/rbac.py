from fastapi import HTTPException

##################################################
# ROLE CHECKER
##################################################

def role_required(allowed_roles):

    def checker(user):

        if user["role"] not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="Access Denied"
            )

        return True

    return checker