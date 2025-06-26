from fastapi import APIRouter

from app.api.routes import defects, users, auth

router = APIRouter()
 
router.include_router(defects.router, prefix="/defects", tags=["defects"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(auth.router, prefix="/auth", tags=["auth"]) 