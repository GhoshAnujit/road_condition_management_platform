# Road Condition Management Platform

A full-stack application that allows users to report and visualize road defects on an interactive map. This platform helps municipalities and road maintenance teams identify, track, and prioritize road repairs.

## Project Structure

- **frontend/** - React-based web interface with interactive map and reporting features
- **backend/** - FastAPI application deployed as AWS Lambda functions
- **infrastructure/** - Terraform configurations and deployment scripts
- **docs/** - System design documentation and technical specifications

## Features

- Interactive map interface for visualizing road defects
- User-friendly form to report new road defects
- REST API for submitting and retrieving road defect data
- Analytics dashboard showing defect statistics and trends
- Heatmap overlay for defect density visualization
- Geospatial querying capabilities
- Batch processing for large datasets

## Technology Stack

### Frontend
- React with TypeScript
- Material UI for components
- Mapbox GL for interactive maps
- Chart.js for data visualization

### Backend
- Python 3.9+
- FastAPI framework
- SQLAlchemy ORM
- PostgreSQL with PostGIS for geospatial data
- AWS Lambda for serverless execution

### Infrastructure
- AWS API Gateway
- AWS Lambda
- AWS RDS (PostgreSQL)
- AWS S3 for static website hosting
- AWS EC2 for batch processing

## Setup Instructions

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL with PostGIS extension

### Local Development

1. Clone the repository
   ```
   git clone https://github.com/yourusername/road_condition_management_platform.git
   cd road_condition_management_platform
   ```

2. Set up the frontend:
   ```
   cd frontend
   npm install
   cp .env.example .env  # Edit with your settings
   npm start
   ```

3. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # Edit with your settings
   ./setup.sh  # Sets up database and initial migrations
   uvicorn main:app --reload
   ```

## Deployment

### Frontend Deployment (AWS S3)

1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```

2. Deploy to S3:
   ```
   cd ../infrastructure/scripts
   ./deploy-frontend.sh
   ```

### Backend Deployment (AWS Lambda)

1. Deploy using the provided script:
   ```
   cd infrastructure/scripts
   ./deploy-lambda.sh
   ```

2. Alternatively, follow the detailed deployment steps in `backend/README.md`

### Infrastructure Setup

The `infrastructure/terraform` directory contains Terraform configurations for setting up the required AWS resources:

```
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## API Documentation

When running locally, API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

In production, documentation is available at your API Gateway URL + `/docs`

## Contributing

Please see CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 