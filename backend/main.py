from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from mangum import Mangum

from app.api.routes import router as api_router
from app.core.config import settings

app = FastAPI(
    title="Road Metrics AI API",
    description="API for road condition assessment and defect reporting",
    version="0.1.0",
)

# CORS middleware setup - More specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "X-Total-Count"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Root endpoint that redirects to docs
@app.get("/")
def root():
    return {"message": "Welcome to Road Metrics AI API", 
            "documentation": "/docs",
            "health": "/health"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# AWS Lambda handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 