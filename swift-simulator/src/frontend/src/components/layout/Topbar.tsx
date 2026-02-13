import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const getBreadcrumb = (path: string) => {
  if (path.startsWith('/transactions/')) return 'Histórico > Detalhes';
  if (path.startsWith('/accounts/')) return 'Conta > Detalhes';
  if (path.startsWith('/messages/view/')) return 'Mensagens > Detalhes';
  if (path.startsWith('/messages/')) return 'Mensagens > Nova';
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/transfer': 'Transferências > Nova',
    '/messages': 'Mensagens SWIFT',
    '/transactions': 'Histórico',
    '/profile': 'Perfil',
  };
  return map[path] || 'Dashboard';
};

interface TopbarProps {
  onMenuClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const breadcrumb = getBreadcrumb(location.pathname);

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={onMenuClick} edge="start">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="body2" sx={{ color: '#6B6B6B' }}>
            {breadcrumb}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton color="inherit" size="small" sx={{ color: '#6B6B6B' }}>
            <Badge badgeContent={0} color="default">
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
          <IconButton
            onClick={handleUserMenu}
            sx={{ ml: 0.5, color: '#333333' }}
            aria-controls={anchorEl ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
          >
            <PersonIcon sx={{ mr: 0.5 }} />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name || 'Usuário'}
            </Typography>
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleProfile}>Perfil</MenuItem>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
