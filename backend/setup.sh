#!/bin/bash

# Exit on error
set -e

echo "Setting up Road Metrics AI backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed or not in PATH. Please install PostgreSQL and try again."
    echo "You can continue, but you'll need to set up the database manually."
else
    # Check if database exists, create if it doesn't
    if ! psql -lqt | cut -d \| -f 1 | grep -qw roadmetrics; then
        echo "Creating database 'roadmetrics'..."
        createdb roadmetrics
    else
        echo "Database 'roadmetrics' already exists."
    fi
fi

# Set up environment variables
if [ ! -f ".env" ]; then
    echo "Creating .env file with default values..."
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roadmetrics" > .env
    echo "SECRET_KEY=temporarysecretkey" >> .env
    echo "AWS_REGION=us-east-1" >> .env
    echo "S3_BUCKET=roadmetrics-data-dev" >> .env
    echo "Please update the .env file with your actual values."
fi

# Run database migrations
echo "Running database migrations..."
if command -v alembic &> /dev/null; then
    alembic upgrade head
else
    echo "Alembic is not in PATH. Trying to run it from the virtual environment..."
    venv/bin/alembic upgrade head
fi

echo "Setup complete! You can now run the server with: uvicorn main:app --reload" 