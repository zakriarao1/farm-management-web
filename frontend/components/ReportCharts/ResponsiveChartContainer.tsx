// src/components/ReportCharts/ResponsiveChartContainer.tsx

import React from 'react';
import { Box } from '@mui/material';
import { useMobile } from '../../src/hooks/useMobile';

interface ResponsiveChartContainerProps {
  children: React.ReactNode;
  height?: number;
}

export const ResponsiveChartContainer: React.FC<ResponsiveChartContainerProps> = ({ 
  children, 
  height = 300 
}) => {
  const { isMobile, isTablet } = useMobile();

  const responsiveHeight = isMobile ? 250 : isTablet ? 280 : height;

  return (
    <Box 
      sx={{ 
        height: responsiveHeight,
        position: 'relative',
        '& canvas': {
          maxWidth: '100% !important',
        }
      }}
    >
      {children}
    </Box>
  );
};
