import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// API URL - In production, this would come from environment variables
const API_URL = 'http://localhost:8000/api';

interface DefectStatistics {
  total_count: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_time: Record<string, number>;
}

const Analytics: React.FC = () => {
  const [statistics, setStatistics] = useState<DefectStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/defects/statistics/summary`);
      setStatistics(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load analytics data. Please try again later.');
      setLoading(false);
    }
  };

  // Format data for charts
  const getTypeChartData = () => {
    if (!statistics) return null;

    const labels = Object.keys(statistics.by_type);
    const data = Object.values(statistics.by_type);

    const backgroundColors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Defect Types',
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const getSeverityChartData = () => {
    if (!statistics) return null;

    const labels = Object.keys(statistics.by_severity);
    const data = Object.values(statistics.by_severity);

    // Color mapping based on severity
    const backgroundColors = {
      low: 'rgba(46, 204, 113, 0.6)',
      medium: 'rgba(241, 196, 15, 0.6)',
      high: 'rgba(231, 76, 60, 0.6)',
      critical: 'rgba(155, 29, 19, 0.6)',
    };

    return {
      labels,
      datasets: [
        {
          label: 'Severity Levels',
          data,
          backgroundColor: labels.map(label => backgroundColors[label as keyof typeof backgroundColors] || 'rgba(52, 152, 219, 0.6)'),
          borderWidth: 1,
        },
      ],
    };
  };

  const getTimeChartData = () => {
    if (!statistics) return null;

    // Sort time data by month
    const sortedLabels = Object.keys(statistics.by_time).sort();
    const sortedData = sortedLabels.map(label => statistics.by_time[label]);

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Reported Defects Over Time',
          data: sortedData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
      ],
    };
  };

  // Find most common defect type
  const getMostCommonDefect = () => {
    if (!statistics) return null;
    
    const defectTypes = statistics.by_type;
    let mostCommon = { type: '', count: 0 };
    
    Object.entries(defectTypes).forEach(([type, count]) => {
      if (count > mostCommon.count) {
        mostCommon = { type, count };
      }
    });
    
    return mostCommon;
  };

  const mostCommonDefect = getMostCommonDefect();

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Road Condition Analytics
        </Typography>
        <Typography variant="body1" paragraph>
          Visualized analysis of reported road defects and their distribution.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Defects
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {statistics?.total_count || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Most Common
                  </Typography>
                  <Typography variant="h5" color="primary" noWrap>
                    {mostCommonDefect?.type || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {mostCommonDefect ? `${mostCommonDefect.count} reports` : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Critical Issues
                  </Typography>
                  <Typography variant="h3" color="error">
                    {statistics?.by_severity?.critical || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Defect Types
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {statistics ? Object.keys(statistics.by_type).length : 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Defect Types Distribution
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {getTypeChartData() ? (
                    <Pie data={getTypeChartData()!} options={{ maintainAspectRatio: false }} />
                  ) : (
                    <Typography color="textSecondary">No data available</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Severity Distribution
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {getSeverityChartData() ? (
                    <Bar 
                      data={getSeverityChartData()!} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }} 
                    />
                  ) : (
                    <Typography color="textSecondary">No data available</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Defects Reported Over Time
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {getTimeChartData() ? (
                    <Line 
                      data={getTimeChartData()!} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }} 
                    />
                  ) : (
                    <Typography color="textSecondary">No data available</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Analytics; 