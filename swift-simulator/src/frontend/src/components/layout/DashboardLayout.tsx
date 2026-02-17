import React, { useState } from 'react';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Topbar from './Topbar';
import StatusBar from './StatusBar';
import SwiftHeader, { isSwiftPath } from '../swift/SwiftHeader';
import SwiftFooter from '../swift/SwiftFooter';
import PageTransition from '../ui/PageTransition';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showSwiftHeader = isSwiftPath(location.pathname);

  const sidebarContent = (
    <Sidebar
      collapsed={false}
      onCloseDrawer={isMobile ? () => setMobileOpen(false) : undefined}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }} data-swift-module={showSwiftHeader ? '' : undefined}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
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
        {showSwiftHeader ? (
          <SwiftHeader onMenuClick={() => setMobileOpen((v) => !v)} />
        ) : (
          <>
            <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
            <StatusBar />
          </>
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            p: 2,
            overflow: 'auto',
            bgcolor: 'background.default',
          }}
        >
          <PageTransition>{children}</PageTransition>
        </Box>
        {showSwiftHeader && <SwiftFooter />}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
