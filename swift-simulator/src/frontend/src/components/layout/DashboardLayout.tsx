import React, { useState } from 'react';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Topbar from './Topbar';
import StatusBar from './StatusBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const sidebarContent = <Sidebar collapsed={false} />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        sidebarContent
      )}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenuClick={handleDrawerToggle} />
        <StatusBar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: 'background.default',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
