# Road Metrics AI - Frontend

This is the frontend for the Road Metrics AI platform, which provides road condition assessment and management solutions.

## Technology Stack

- **Framework**: React with TypeScript
- **UI Libraries**: Material UI, Bootstrap, and jQuery
- **Maps Integration**: Mapbox GL JS
- **Charting**: Chart.js with react-chartjs-2
- **HTTP Client**: Axios
- **Routing**: React Router

## Features

- Interactive map for visualizing and reporting road defects
- Form for submitting defect information with location, type, and severity
- Analytics dashboard with statistics and charts
- Heatmap overlay for visualizing defect density
- Responsive design that works across devices

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- API backend running (see the `/backend` directory)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with your Mapbox access token:
   ```
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   REACT_APP_API_URL=http://localhost:8000/api
   ```

3. Start the development server:
   ```
   npm start
   ```

The application will open in your browser at `http://localhost:3000`.

## Build for Production

To build the application for production deployment:

```
npm run build
```

This creates a `build` folder with optimized production files.

## Project Structure

- **src/components**: Reusable UI components
- **src/pages**: Page components for different routes
- **src/services**: API service functions
- **src/utils**: Utility functions
- **src/assets**: Static assets
- **src/types**: TypeScript type definitions

## Connection to Backend

The frontend connects to the backend API running at the URL specified in the environment variable `REACT_APP_API_URL` (defaults to `http://localhost:8000/api`). Make sure the backend is running before using the frontend.

## Deployment

This frontend can be deployed as a static site to:
- AWS S3 with CloudFront
- Netlify
- Vercel
- GitHub Pages

See the `/infrastructure` directory for deployment configurations.
