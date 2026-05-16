from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from config import settings
from models.user import User
from beanie import PydanticObjectId

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise credentials_exception
    return user

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return await User.get(PydanticObjectId(user_id))
    except Exception:
        return None

def RoleChecker(allowed_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            # Auditor inherits all, Worker inherits Citizen
            if "auditor" in allowed_roles and current_user.role == "auditor":
                return current_user
            if "worker" in allowed_roles and current_user.role in ["worker", "auditor"]:
                return current_user
            if "citizen" in allowed_roles:
                return current_user
            raise HTTPException(status_code=403, detail="Operation not permitted")
        return current_user
    return role_checker
