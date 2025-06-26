import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import api from './services/api';

// Lazy-loaded components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Map = lazy(() => import('./pages/Map'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Loading component
const LoadingScreen = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh"
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testApiConnection = async () => {
    try {
      setLoading(true);
      console.log('Testing API connection...');
      
      // Direct fetch to test the connection
      const directResponse = await fetch('http://localhost:8000/api/defects');
      const directData = await directResponse.text();
      console.log('Direct fetch response:', directData);
      
      // Using our API service
      const apiResponse = await api.defects.getAll();
      console.log('API service response:', apiResponse);
      
      setTestResponse(`Direct fetch: ${directData.substring(0, 100)}... | API service: ${JSON.stringify(apiResponse).substring(0, 100)}...`);
    } catch (error) {
      console.error('API test error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResponse(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Header />
          <Box sx={{ flexGrow: 1, p: 3, pt: 10 }}>
            {/* Test API Button - Only in development */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={testApiConnection}
                  disabled={loading}
                >
                  {loading ? 'Testing API...' : 'Test API Connection'}
                </Button>
                {testResponse && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#fff', borderRadius: 1, maxHeight: '100px', overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{testResponse}</pre>
                  </Box>
                )}
              </Box>
            )}
            
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<Map />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Box>
          <Footer />
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
