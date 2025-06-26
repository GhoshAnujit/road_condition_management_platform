import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Grid, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress } from '@mui/material';
import Paper from '@mui/material/Paper';
import { Link } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../services/api';

// Format date to a readable string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Get severity color
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
};

// Format defect type to be more readable
const formatDefectType = (type: string) => {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const Dashboard: React.FC = () => {
  const [recentDefects, setRecentDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent defects on component mount
  useEffect(() => {
    const fetchRecentDefects = async () => {
      try {
        setLoading(true);
        console.log('Initial fetch: Fetching defects from API...');
        
        // Try direct fetch first for debugging
        try {
          console.log('Initial fetch: Trying direct fetch first...');
          const directResponse = await fetch('http://localhost:8000/api/defects');
          console.log('Initial fetch: Direct fetch status:', directResponse.status);
          const directData = await directResponse.json();
          console.log('Initial fetch: Direct fetch data:', directData);
          
          if (directData && directData.length > 0) {
            console.log('Initial fetch: Direct fetch successful, using this data');
            const sortedDefects = directData.sort((a: any, b: any) => 
              new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
            );
            setRecentDefects(sortedDefects.slice(0, 5));
            setLoading(false);
            return; // Exit early if direct fetch worked
          }
        } catch (directErr) {
          console.error('Initial fetch: Direct fetch failed:', directErr);
          // Continue with API service approach
        }
        
        // Fall back to API service
        console.log('Initial fetch: Falling back to API service...');
        const response = await api.defects.getAll();
        console.log('Initial fetch: API Response:', response);
        
        if (response.error) {
          setError(response.error);
          console.error('Initial fetch: API returned error:', response.error);
        } else {
          // Sort defects by reported_at date (newest first)
          const sortedDefects = response.data.sort((a, b) => 
            new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
          );
          console.log('Initial fetch: Sorted defects:', sortedDefects);
          // Take only the 5 most recent defects
          setRecentDefects(sortedDefects.slice(0, 5));
        }
      } catch (err) {
        console.error('Initial fetch: Error fetching recent defects:', err);
        setError('Failed to fetch recent activity.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDefects();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Road Metrics AI Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          AI-driven road condition assessment and management solutions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Feature Cards */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <MapIcon
                sx={{ fontSize: 40, color: 'primary.main', mr: 1 }}
              />
              <Typography variant="h6" component="h2">
                Interactive Map
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1 }}>
              View and report road defects on our interactive map interface.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/map"
              fullWidth
            >
              Open Map
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <ReportProblemIcon
                sx={{ fontSize: 40, color: 'error.main', mr: 1 }}
              />
              <Typography variant="h6" component="h2">
                Report Defects
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1 }}>
              Easily report road defects by clicking on the map at their location.
            </Typography>
            <Button
              variant="contained"
              color="error"
              component={Link}
              to="/map"
              fullWidth
            >
              Report Issue
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <AnalyticsIcon
                sx={{ fontSize: 40, color: 'success.main', mr: 1 }}
              />
              <Typography variant="h6" component="h2">
                Data Analytics
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1 }}>
              Explore road condition analytics with insightful charts and statistics.
            </Typography>
            <Button
              variant="contained"
              color="success"
              component={Link}
              to="/analytics"
              fullWidth
            >
              View Analytics
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <AssessmentIcon
                sx={{ fontSize: 40, color: 'warning.main', mr: 1 }}
              />
              <Typography variant="h6" component="h2">
                Heat Maps
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1 }}>
              Visualize road defect density with customizable heat map overlays.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              component={Link}
              to="/map?overlay=heatmap"
              fullWidth
            >
              View Heat Map
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity Panel */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Activity
              </Typography>
              
              {/* Debug buttons - Only in development */}
              {process.env.NODE_ENV === 'development' && (
                <Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mr: 1 }}
                    onClick={() => {
                      console.log('Manual refresh triggered');
                      setLoading(true);
                      api.defects.getAll()
                        .then(response => {
                          console.log('Manual API response:', response);
                          if (response.error) {
                            setError(response.error);
                          } else {
                            const sortedDefects = response.data.sort((a, b) => 
                              new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
                            );
                            setRecentDefects(sortedDefects.slice(0, 5));
                          }
                        })
                        .catch(err => {
                          console.error('Manual refresh error:', err);
                          setError('Failed to fetch recent activity.');
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    API Refresh
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="secondary"
                    onClick={() => {
                      console.log('Direct fetch triggered');
                      setLoading(true);
                      fetch('http://localhost:8000/api/defects')
                        .then(response => {
                          console.log('Direct fetch status:', response.status);
                          return response.json();
                        })
                        .then(data => {
                          console.log('Direct fetch data:', data);
                          const sortedDefects = data.sort((a: any, b: any) => 
                            new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
                          );
                          setRecentDefects(sortedDefects.slice(0, 5));
                          setError(null);
                        })
                        .catch(err => {
                          console.error('Direct fetch error:', err);
                          setError('Failed to fetch recent activity (direct).');
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Direct Fetch
                  </Button>
                </Box>
              )}
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                <ErrorOutlineIcon sx={{ mr: 1 }} />
                <Typography variant="body2">{error}</Typography>
              </Box>
            ) : recentDefects.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No recent activity to display. Start by reporting road defects or exploring the map.
              </Typography>
            ) : (
              <List>
                {recentDefects.map((defect) => (
                  <ListItem 
                    key={defect.id}
                    sx={{ 
                      borderBottom: '1px solid #eee',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemIcon>
                      <ReportProblemIcon color={getSeverityColor(defect.severity) as any} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{formatDefectType(defect.defect_type)}</span>
                          <Chip 
                            label={defect.severity} 
                            size="small" 
                            color={getSeverityColor(defect.severity) as any} 
                            variant="outlined" 
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            Reported at: {formatDate(defect.reported_at)}
                          </Typography>
                          {defect.notes && (
                            <Typography component="p" variant="body2" sx={{ mt: 0.5 }}>
                              Notes: {defect.notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link}
                      to={`/map?defect=${defect.id}`}
                    >
                      View on Map
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 