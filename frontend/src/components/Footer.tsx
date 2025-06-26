import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[200],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          <Link color="inherit" href="https://roadmetrics.ai/">
            Road Metrics AI
          </Link>{' '}
          {new Date().getFullYear()}
          {' | AI-driven road condition assessment and management solutions'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 