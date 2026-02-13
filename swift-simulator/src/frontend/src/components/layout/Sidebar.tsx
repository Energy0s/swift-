import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Send as SendIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Payment as PaymentIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { PAGAMENTOS, MENSAGENS, TESOURARIA_FX, TRADE_COLLECTIONS, SECURITIES } from '../../constants/swiftMtTypes';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED = 72;

const staticItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'transfer', path: '/transfer', label: 'Transferências (MT103)', icon: <SendIcon /> },
  { id: 'messages', path: '/messages', label: 'Mensagens SWIFT', icon: <MessageIcon /> },
  { id: 'transactions', path: '/transactions', label: 'Histórico', icon: <HistoryIcon /> },
  { id: 'contas', path: '/dashboard', label: 'Contas', icon: <AccountBalanceIcon /> },
  { id: 'profile', path: '/profile', label: 'Perfil', icon: <PersonIcon /> },
];

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const [openPagamentos, setOpenPagamentos] = useState(true);
  const [openMensagens, setOpenMensagens] = useState(true);
  const [openTesouraria, setOpenTesouraria] = useState(false);
  const [openTrade, setOpenTrade] = useState(false);
  const [openSecurities, setOpenSecurities] = useState(false);

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const effectiveWidth = isMobile ? SIDEBAR_WIDTH : width;

  const isActive = (path: string) => location.pathname === path;
  const isMtActive = (code: string) => location.pathname === `/messages/${code}`;

  const navStyle = (active: boolean) => ({
    borderRadius: 1,
    mx: 0.5,
    color: active ? '#006BA6' : '#6B6B6B',
    '&:hover': {
      bgcolor: '#F7F7F7',
      color: '#333333',
    },
    '&.Mui-selected': {
      bgcolor: '#F0F4F8',
      color: '#006BA6',
      '&:hover': { bgcolor: '#E8EEF4' },
    },
  });

  return (
    <Box
      component="nav"
      sx={{
        width: effectiveWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        overflow: 'auto',
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
        <Box sx={{ overflow: 'auto', height: '100vh', py: 2, minHeight: 0 }}>
        <Box sx={{ px: collapsed ? 2 : 2.5, mb: 2 }}>
          <Typography
            variant="h6"
            noWrap={!collapsed}
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {collapsed ? 'ST' : 'SWIFT Transfer'}
          </Typography>
        </Box>

        <List disablePadding>
          {staticItems.slice(0, 3).map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.id} disablePadding sx={{ px: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={navStyle(active)}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} />}
                </ListItemButton>
              </ListItem>
            );
          })}

          {!collapsed && (
            <>
              <Box sx={{ px: 2, py: 1, mt: 1 }}>
                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Mensagens MT
                </Typography>
              </Box>
              <ListItem disablePadding sx={{ px: 1, mt: 1 }}>
                <ListItemButton onClick={() => setOpenPagamentos(!openPagamentos)} sx={navStyle(false)}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <PaymentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Pagamentos" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                  {openPagamentos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openPagamentos} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {PAGAMENTOS.map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => navigate(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem' }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton onClick={() => setOpenMensagens(!openMensagens)} sx={navStyle(false)}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <MessageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mensagens" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                  {openMensagens ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openMensagens} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {MENSAGENS.map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => navigate(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem' }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton onClick={() => setOpenTesouraria(!openTesouraria)} sx={navStyle(false)}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <PaymentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tesouraria/FX (MT3xx)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                  {openTesouraria ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openTesouraria} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {TESOURARIA_FX.map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => navigate(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem' }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton onClick={() => setOpenTrade(!openTrade)} sx={navStyle(false)}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <MessageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Trade/Collections (MT4xx)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                  {openTrade ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openTrade} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {TRADE_COLLECTIONS.map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => navigate(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem' }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton onClick={() => setOpenSecurities(!openSecurities)} sx={navStyle(false)}>
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <AccountBalanceIcon />
                  </ListItemIcon>
                  <ListItemText primary="Securities (MT5xx)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                  {openSecurities ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openSecurities} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {SECURITIES.map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => navigate(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem' }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </>
          )}

          {staticItems.slice(3).map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.id} disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={navStyle(active)}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED };
