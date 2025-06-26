# Road Condition Reporting Platform

A full-stack application that allows users to report and visualize road defects on an interactive map.

## Project Structure

- **frontend/** - Contains the web interface with interactive map and reporting features
- **backend/** - Contains AWS Lambda functions and API endpoints
- **infrastructure/** - Contains infrastructure as code and deployment scripts
- **docs/** - Contains system design documentation and other technical specifications

## Features

- Interactive map interface for visualizing road defects
- User-friendly form to report new road defects
- REST API for submitting and retrieving road defect data
- Analytics dashboard showing defect statistics
- Heatmap overlay for defect density visualization

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, jQuery, Mapbox
- **Backend**: Python, AWS Lambda, API Gateway
- **Database**: PostgreSQL
- **Infrastructure**: AWS EC2, AWS Lambda
- **CI/CD**: GitHub Actions

## Setup Instructions

### Prerequisites
- AWS Account
- Node.js and npm
- Python 3.8+
- PostgreSQL

### Local Development
1. Clone the repository
2. Set up the frontend:
   ```
   cd frontend
   npm install
   npm start
   ```
3. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   python local_server.py
   ```

## Deployment
Refer to the deployment documentation in the `docs/` directory. 