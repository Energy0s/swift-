import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <Box
      key={location.pathname}
      sx={{
        animation: 'pageFadeIn 0.35s ease-out',
        '@keyframes pageFadeIn': {
          from: {
            opacity: 0,
            transform: 'translateY(12px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {children}
    </Box>
  );
};

export default PageTransition;
