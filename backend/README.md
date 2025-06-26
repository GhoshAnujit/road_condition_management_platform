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

## Deployment

The backend is designed to be deployed as AWS Lambda functions with API Gateway. See the `/infrastructure` directory for deployment configurations. 