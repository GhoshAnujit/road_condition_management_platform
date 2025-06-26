import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Container, Paper, Typography, Button, Modal, TextField, MenuItem, CircularProgress, Switch, FormControlLabel, Snackbar, Alert } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

// This should be in an environment variable in a real app
mapboxgl.accessToken = 'pk.eyJ1IjoiYW51aml0Z2giLCJhIjoiY21jYnZyOW5nMDFrdTJqczdhcDJwZXZkbiJ9.U_k89i7LpEEGkjWMxP9Mww';

// Types for defects
interface Defect {
  id: number;
  defect_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  notes?: string;
  reported_at: string;
}

// Defect types
const defectTypes = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'crack', label: 'Crack' },
  { value: 'damaged_pavement', label: 'Damaged Pavement' },
  { value: 'water_logging', label: 'Water Logging' },
  { value: 'missing_manhole', label: 'Missing Manhole' },
  { value: 'other', label: 'Other' }
];

// Severity levels
const severityLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

// API URL - In production, this would come from environment variables
const API_URL = 'http://localhost:8000/api';

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(searchParams.get('overlay') === 'heatmap');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [markerLocation, setMarkerLocation] = useState<[number, number] | null>(null);
  const [formData, setFormData] = useState({
    defect_type: 'pothole',
    severity: 'medium',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({
    defect_type: false,
    severity: false,
  });

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {
      defect_type: !formData.defect_type,
      severity: !formData.severity,
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  }, [formData]);

  // Add a marker for a defect
  const addDefectMarker = useCallback((defect: Defect) => {
    if (!map.current) return;

    // Create HTML element for the marker
    const el = document.createElement('div');
    el.className = 'defect-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    
    // Color based on severity
    switch (defect.severity) {
      case 'low':
        el.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
        break;
      case 'medium':
        el.style.backgroundColor = 'rgba(241, 196, 15, 0.8)';
        break;
      case 'high':
        el.style.backgroundColor = 'rgba(231, 76, 60, 0.8)';
        break;
      case 'critical':
        el.style.backgroundColor = 'rgba(155, 29, 19, 0.8)';
        break;
      default:
        el.style.backgroundColor = 'rgba(52, 152, 219, 0.8)';
    }

    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 2px rgba(0,0,0,0.3)';
    
    // Add popup
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div>
        <h3>Road Defect</h3>
        <p><strong>Type:</strong> ${defect.defect_type}</p>
        <p><strong>Severity:</strong> ${defect.severity}</p>
        ${defect.notes ? `<p><strong>Notes:</strong> ${defect.notes}</p>` : ''}
        <p><strong>Reported:</strong> ${new Date(defect.reported_at).toLocaleDateString()}</p>
      </div>
    `);

    // Add marker
    new mapboxgl.Marker(el)
      .setLngLat([defect.longitude, defect.latitude])
      .setPopup(popup)
      .addTo(map.current);
  }, []);
  
  // Center map on defects
  const centerMapOnDefects = useCallback(() => {
    if (!map.current || defects.length === 0) return;
    
    // If only one defect, center on it
    if (defects.length === 1) {
      const defect = defects[0];
      map.current.flyTo({
        center: [defect.longitude, defect.latitude],
        zoom: 15, // Closer zoom for single defect
        essential: true
      });
      return;
    }
    
    // If multiple defects, fit the map to contain all of them
    const bounds = new mapboxgl.LngLatBounds();
    
    defects.forEach(defect => {
      bounds.extend([defect.longitude, defect.latitude]);
    });
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
  }, [defects]);

  // Fetch defects from API
  const fetchDefects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/defects`);
      console.log('Fetched defects:', response.data);
      setDefects(response.data);
      
      // Add markers for each defect
      if (map.current) {
        response.data.forEach((defect: Defect) => {
          console.log('Adding marker for defect:', defect);
          addDefectMarker(defect);
        });
        
        // If defects exist, center the map on them
        if (response.data.length > 0) {
          // We'll use the centerMapOnDefects function in the next step
          // after the state has been updated
          setTimeout(() => {
            centerMapOnDefects();
          }, 100);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching defects:', err);
      setError('Failed to load defects. Please try again later.');
      setLoading(false);
    }
  }, [addDefectMarker, centerMapOnDefects]);

  // Set up heatmap layer
  const setupHeatmap = useCallback(() => {
    if (!map.current) return;
    
    try {
      // Use actual defects if available, otherwise use demo data
      const heatmapData = defects.length > 0 ? defects : [
        // Demo data for heatmap if no defects are available
        { id: 1, defect_type: 'pothole', severity: 'high', latitude: 40.01, longitude: -74.5, reported_at: new Date().toISOString() },
        { id: 2, defect_type: 'crack', severity: 'medium', latitude: 40.02, longitude: -74.51, reported_at: new Date().toISOString() },
        { id: 3, defect_type: 'pothole', severity: 'critical', latitude: 40.015, longitude: -74.505, reported_at: new Date().toISOString() },
        { id: 4, defect_type: 'water_logging', severity: 'high', latitude: 40.018, longitude: -74.503, reported_at: new Date().toISOString() },
        { id: 5, defect_type: 'damaged_pavement', severity: 'medium', latitude: 40.022, longitude: -74.51, reported_at: new Date().toISOString() }
      ];

      console.log('Setting up heatmap with data:', heatmapData);

      // Double-check and clean up any existing layers/sources
      try {
        if (map.current.getLayer('defects-point')) {
          map.current.removeLayer('defects-point');
        }
        
        if (map.current.getLayer('defects-heat')) {
          map.current.removeLayer('defects-heat');
        }
        
        if (map.current.getSource('defects')) {
          map.current.removeSource('defects');
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }

      // Add a source for the heatmap
      map.current.addSource('defects', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: heatmapData.map(defect => ({
            type: 'Feature',
            properties: {
              severity: defect.severity,
              type: defect.defect_type,
              weight: defect.severity === 'critical' ? 2.0 : 
                      defect.severity === 'high' ? 1.5 : 
                      defect.severity === 'medium' ? 1.0 : 0.5
            },
            geometry: {
              type: 'Point',
              coordinates: [defect.longitude, defect.latitude]
            }
          }))
        }
      });

      // Add the heatmap layer with enhanced visibility
      map.current.addLayer({
        id: 'defects-heat',
        type: 'heatmap',
        source: 'defects',
        paint: {
          // Increase the heatmap weight based on severity
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'weight'],
            0.5, 0.6,
            1.0, 0.8,
            1.5, 0.9,
            2.0, 1.0
          ],
          // Increase the heatmap intensity to make it more visible
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 1,
            9, 3
          ],
          // Color ramp for heatmap from blue to red
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',
            0.2, 'rgb(103, 169, 207)',
            0.4, 'rgb(209, 229, 240)',
            0.6, 'rgb(253, 219, 199)',
            0.8, 'rgb(239, 138, 98)',
            1, 'rgb(178, 24, 43)'
          ],
          // Adjust the heatmap radius by zoom level for better visibility
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 10,
            9, 30
          ],
          // Increase opacity for better visibility
          'heatmap-opacity': 0.9
        }
      });
      
      // Also add a circle layer to make individual points more visible
      map.current.addLayer({
        id: 'defects-point',
        type: 'circle',
        source: 'defects',
        paint: {
          // Size of the circle
          'circle-radius': 8,
          // Color based on severity
          'circle-color': [
            'match', ['get', 'severity'],
            'critical', '#b2182b',
            'high', '#ef8a62',
            'medium', '#fddbc7',
            'low', '#d1e5f0',
            '#67a9cf'  // default
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // Center map on the heatmap data
      if (heatmapData.length > 0) {
        centerMapOnDefects();
      }
      
    } catch (error) {
      console.error('Error setting up heatmap:', error);
      setError('Failed to display heatmap. Please try again.');
    }
  }, [defects, centerMapOnDefects]);

  // Toggle heatmap visibility
  const toggleHeatmap = useCallback(() => {
    if (!map.current) return;
    
    const newHeatmapState = !heatmapEnabled;
    setHeatmapEnabled(newHeatmapState);
    
    try {
      // Clean up existing layers and sources regardless of state change
      if (map.current.getLayer('defects-point')) {
        map.current.removeLayer('defects-point');
      }
      
      if (map.current.getLayer('defects-heat')) {
        map.current.removeLayer('defects-heat');
      }
      
      if (map.current.getSource('defects')) {
        map.current.removeSource('defects');
      }
      
      if (newHeatmapState) {
        // Enable heatmap after cleanup
        setTimeout(() => {
          setupHeatmap();
          console.log('Heatmap enabled');
        }, 100); // Small delay to ensure cleanup completes
        setSearchParams({ overlay: 'heatmap' });
      } else {
        setSearchParams({});
        console.log('Heatmap disabled');
      }
    } catch (error) {
      console.error('Error toggling heatmap:', error);
    }
  }, [heatmapEnabled, setupHeatmap, setSearchParams]);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // already initialized
    
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.5, 40], // Default to NYC area
        zoom: 9
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }));

      // Set up click handler for adding defects
      map.current.on('click', (e) => {
        setMarkerLocation([e.lngLat.lng, e.lngLat.lat]);
        setModalOpen(true);
        // Reset form data and errors
        setFormData({
          defect_type: 'pothole',
          severity: 'medium',
          notes: '',
        });
        setFormErrors({
          defect_type: false,
          severity: false,
        });
      });

      // When the map loads
      map.current.on('load', () => {
        // First fetch defects
        fetchDefects();
        
        // Wait a bit before setting up heatmap to ensure defects are loaded
        setTimeout(() => {
          // Check if we should display heatmap
          if (searchParams.get('overlay') === 'heatmap') {
            setHeatmapEnabled(true);
            setupHeatmap();
          }
        }, 500);
      });
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on component mount
  
  // Update heatmap when defects change and heatmap is enabled
  useEffect(() => {
    if (map.current && heatmapEnabled && map.current.loaded()) {
      setupHeatmap();
    }
  }, [defects, heatmapEnabled, setupHeatmap]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!markerLocation) return;
    
    // Validate form
    if (!validateForm()) return;
    
    setSubmitting(true);
    const [longitude, latitude] = markerLocation;
    
    try {
      const payload = {
        defect_type: formData.defect_type,
        severity: formData.severity,
        latitude,
        longitude,
        notes: formData.notes || undefined
      };
      
      const response = await axios.post(`${API_URL}/defects`, payload);
      
      // Add the new defect to the map
      addDefectMarker(response.data);
      
      // Add to state
      setDefects([...defects, response.data]);
      
      // Close modal and reset form
      setModalOpen(false);
      setFormData({
        defect_type: 'pothole',
        severity: 'medium',
        notes: '',
      });
      
      // Show success message
      setSnackbarMessage('Defect reported successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error('Error submitting defect:', err);
      setSnackbarMessage('Failed to submit defect. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  }, [markerLocation, formData, addDefectMarker, defects, validateForm]);

  // Handle form changes
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for the field being changed
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: false
      });
    }
  }, [formData, formErrors]);

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Road Defect Map
        </Typography>
        <Typography variant="body1" paragraph>
          Click anywhere on the map to report a road defect. View existing defects marked on the map.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={heatmapEnabled}
                onChange={toggleHeatmap}
                color="primary"
              />
            }
            label="Show Heatmap"
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={centerMapOnDefects}
            disabled={defects.length === 0}
          >
            Center on Defects
          </Button>
        </Box>
      </Paper>

      {error && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Box
        sx={{
          height: 'calc(100vh - 300px)',
          minHeight: '400px',
          width: '100%',
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          mb: 3
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 999
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </Box>

      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        aria-labelledby="report-defect-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Report Road Defect
          </Typography>
          
          {markerLocation && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Location: {markerLocation[1].toFixed(6)}, {markerLocation[0].toFixed(6)}
            </Typography>
          )}
          
          <TextField
            select
            fullWidth
            margin="normal"
            name="defect_type"
            label="Defect Type"
            value={formData.defect_type}
            onChange={handleFormChange}
            error={formErrors.defect_type}
            helperText={formErrors.defect_type ? "Defect type is required" : ""}
            required
          >
            {defectTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            fullWidth
            margin="normal"
            name="severity"
            label="Severity"
            value={formData.severity}
            onChange={handleFormChange}
            error={formErrors.severity}
            helperText={formErrors.severity ? "Severity is required" : ""}
            required
          >
            {severityLevels.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            margin="normal"
            name="notes"
            label="Notes (Optional)"
            multiline
            rows={3}
            value={formData.notes}
            onChange={handleFormChange}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Map; 