from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from mangum import Mangum

from app.api.routes import router as api_router
from app.core.config import settings

# Initialize FastAPI application with metadata
app = FastAPI(
    title="Road Metrics AI API",
    description="API for road condition assessment and defect reporting",
    version="0.1.0",
)

# CORS middleware setup to allow cross-origin requests
# This is essential for the frontend (hosted on S3) to communicate with the backend API
app.add_middleware(
    CORSMiddleware,
    # Specify allowed origins - the S3 website URL where the frontend is hosted
    allow_origins=["http://roadmetrics-frontend.s3-website-us-east-1.amazonaws.com"],
    # Allow cookies and authentication headers to be sent with requests
    allow_credentials=True,
    # Allow specific HTTP methods
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    # Allow all headers in requests
    allow_headers=["*"],
    # Specify which headers should be exposed to the frontend
    expose_headers=["Content-Type", "X-Total-Count"],
)

# Include API routes with prefix
# All API endpoints will be under /api/... path
app.include_router(api_router, prefix="/api")

# Root endpoint that provides basic API information
@app.get("/")
def root():
    return {"message": "Welcome to Road Metrics AI API", 
            "documentation": "/docs",
            "health": "/health"}

# Health check endpoint for monitoring and AWS health checks
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# AWS Lambda handler using Mangum
# This allows the FastAPI app to run as an AWS Lambda function
# Mangum translates between AWS Lambda events and FastAPI requests
handler = Mangum(app)
