# Road Metrics AI - Backend

This directory contains the backend API for the Road Metrics AI platform, which provides road condition assessment and management solutions.

## Technology Stack

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with PostGIS for geospatial data
- **ORM**: SQLAlchemy
- **Authentication**: JWT-based token authentication
- **API Documentation**: Swagger/OpenAPI via FastAPI
- **Deployment**: AWS Lambda with API Gateway

## Features

- Submission and retrieval of road defect data
- External data ingestion via the upload API
- User authentication and management
- Analytics and statistics on road defects
- Geospatial querying capabilities

## Development Setup

### Prerequisites

- Python 3.9+
- PostgreSQL with PostGIS extension
- Docker (optional)

### Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roadmetrics
   export SECRET_KEY=yoursecretkey
   ```

4. Initialize the database:
   ```
   alembic upgrade head
   ```

5. Run the development server:
   ```
   uvicorn main:app --reload
   ```

### Docker Setup

Alternatively, you can use Docker:

```
docker build -t roadmetrics-backend .
docker run -p 8000:8000 -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/roadmetrics roadmetrics-backend
```

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

To create a new migration:

```
alembic revision --autogenerate -m "Description of changes"
```

To apply migrations:

```
alembic upgrade head
```

## AWS Deployment

The backend is designed to be deployed as AWS Lambda functions with API Gateway. Follow these steps for deployment:

### Prerequisites for Deployment

1. AWS CLI installed and configured with appropriate permissions
2. An RDS PostgreSQL instance with PostGIS extension enabled
3. An S3 bucket for storing deployment packages

### Deployment Steps

1. **Create a deployment package**:
   ```
   pip install -r requirements.txt -t ./package
   cp -r app main.py ./package/
   cd package
   zip -r ../deployment-package.zip .
   cd ..
   ```

2. **Create Lambda Function**:
   ```
   aws lambda create-function \
     --function-name road-metrics-api \
     --runtime python3.9 \
     --handler main.handler \
     --memory-size 256 \
     --timeout 30 \
     --role arn:aws:iam::<account-id>:role/lambda-execution-role \
     --zip-file fileb://deployment-package.zip
   ```

3. **Set Environment Variables**:
   ```
   aws lambda update-function-configuration \
     --function-name road-metrics-api \
     --environment "Variables={DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/roadmetrics,SECRET_KEY=your-secret-key}"
   ```

4. **Create API Gateway**:
   - Create a new REST API in API Gateway
   - Create a proxy resource with `{proxy+}` path
   - Set up a `ANY` method that integrates with your Lambda function
   - Deploy the API to a stage (e.g., "prod")

5. **Configure CORS**:
   - In API Gateway, enable CORS for your API resources
   - Ensure the following headers are allowed:
     - Access-Control-Allow-Origin: 'http://roadmetrics-frontend.s3-website-us-east-1.amazonaws.com'
     - Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
     - Access-Control-Allow-Methods: 'GET,POST,PUT,DELETE,OPTIONS'

6. **Database Migration**:
   - Run migrations on your RDS instance:
   ```
   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/roadmetrics alembic upgrade head
   ```

### Updating the Deployment

To update your Lambda function after making changes:

```
# Create a new deployment package
pip install -r requirements.txt -t ./package
cp -r app main.py ./package/
cd package
zip -r ../deployment-package.zip .
cd ..

# Update the Lambda function
aws lambda update-function-code \
  --function-name road-metrics-api \
  --zip-file fileb://deployment-package.zip
```

### Monitoring and Troubleshooting

- Check CloudWatch Logs for Lambda execution logs
- Set up CloudWatch Alarms for monitoring API performance
- Use X-Ray for tracing requests through the application

For more detailed deployment configurations, see the `/infrastructure` directory. 