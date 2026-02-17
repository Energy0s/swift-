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
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { PAGAMENTOS, MENSAGENS, MENSAGENS_GROUPS, PAGAMENTOS_GROUPS, TESOURARIA_FX, TESOURARIA_GROUPS, getGroupByCode, TRADE_COLLECTIONS, TRADE_GROUPS, SECURITIES, SECURITIES_GROUPS } from '../../constants/swiftMtTypes';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED = 72;

const staticItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'transfer', path: '/transfer', label: 'Transferências (MT103)', icon: <SendIcon /> },
  { id: 'inbox', path: '/inbox', label: 'Caixa de Entrada', icon: <InboxIcon /> },
  { id: 'messages', path: '/messages', label: 'Mensagens SWIFT', icon: <MessageIcon /> },
  { id: 'transactions', path: '/transactions', label: 'Histórico', icon: <HistoryIcon /> },
  { id: 'contas', path: '/dashboard', label: 'Contas', icon: <AccountBalanceIcon /> },
  { id: 'profile', path: '/profile', label: 'Perfil', icon: <PersonIcon /> },
];

interface SidebarProps {
  collapsed?: boolean;
  onCloseDrawer?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCloseDrawer }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const [openPagamentos, setOpenPagamentos] = useState(false);
  const [openMensagens, setOpenMensagens] = useState(false);
  const [openFree, setOpenFree] = useState(false);
  const [openTesouraria, setOpenTesouraria] = useState(false);
  const [openTrade, setOpenTrade] = useState(false);
  const [openSecurities, setOpenSecurities] = useState(false);

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const effectiveWidth = isMobile ? SIDEBAR_WIDTH : width;

  const isActive = (path: string) => location.pathname === path;
  const isMtActive = (code: string) => {
    if (code === 'MT101' || code === 'MT102' || code === 'MT102STP') return location.pathname.startsWith('/mt101');
    if (code === 'MT103' || code === 'MT103REMIT' || code === 'MT103STP') return location.pathname.startsWith('/mt103');
    if (code === 'MT109' || code === 'MT110') return location.pathname.startsWith('/mt109');
    if (code === 'FREE') return location.pathname.startsWith('/free');
    const group = getGroupByCode(code);
    if (group) return location.pathname === `/messages/${group.route}`;
    return location.pathname === `/messages/${code}`;
  };

  const handleNav = (path: string) => {
    navigate(path);
    onCloseDrawer?.();
  };

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
          <Box
            component="img"
            src="/swift-logo.svg"
            alt="SWIFT Transfer"
            sx={{
              height: collapsed ? 22 : 28,
              width: 'auto',
              maxWidth: collapsed ? 48 : 140,
              objectFit: 'contain',
            }}
          />
        </Box>

        <List disablePadding sx={{ '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }}>
          {staticItems.slice(0, 3).map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.id} disablePadding sx={{ px: 1 }}>
                <ListItemButton
                  onClick={() => handleNav(item.path)}
                  selected={active}
                  sx={navStyle(active)}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 300 }} />}
                </ListItemButton>
              </ListItem>
            );
          })}

          {!collapsed && (
            <>
              <Box sx={{ px: 2, py: 1, mt: 1 }}>
                <Typography variant="caption" fontWeight={300} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Mensagens MT
                </Typography>
              </Box>
              <ListItem disablePadding sx={{ px: 1, mt: 1 }}>
                <ListItemButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPagamentos(!openPagamentos);
                  }}
                  sx={navStyle(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <PaymentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Pagamentos" primaryTypographyProps={{ fontWeight: 300, fontSize: '0.875rem' }} />
                  {openPagamentos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openPagamentos} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding sx={{ pl: 4, pr: 1 }}>
                    <ListItemButton
                      onClick={() => handleNav('/mt101')}
                      selected={isMtActive('MT101')}
                      sx={{ ...navStyle(isMtActive('MT101')), py: 0.5 }}
                    >
                      <ListItemText
                        primary="MT101 / MT102 / MT102+ (STP)"
                        secondary="Transferência Múltipla"
                        primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding sx={{ pl: 4, pr: 1 }}>
                    <ListItemButton
                      onClick={() => handleNav('/mt103')}
                      selected={isMtActive('MT103')}
                      sx={{ ...navStyle(isMtActive('MT103')), py: 0.5 }}
                    >
                      <ListItemText
                        primary="MT103 / MT103+ (REMIT) / MT103+ (STP)"
                        secondary="Transferência de Crédito"
                        primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {PAGAMENTOS_GROUPS.map((g) => (
                    <ListItem key={g.route} disablePadding sx={{ pl: 4, pr: 1 }}>
                      <ListItemButton
                        onClick={() => handleNav(`/messages/${g.route}`)}
                        selected={g.codes.some((c) => isMtActive(c))}
                        sx={{ ...navStyle(g.codes.some((c) => isMtActive(c))), py: 0.5 }}
                      >
                        <ListItemText
                          primary={g.label}
                          secondary={g.secondary}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                          secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {PAGAMENTOS.filter((mt) => !['MT101', 'MT102', 'MT102STP', 'MT103', 'MT103REMIT', 'MT103STP'].includes(mt.code) && !PAGAMENTOS_GROUPS.some((g) => g.codes.includes(mt.code))).map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => handleNav(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFree(!openFree);
                  }}
                  sx={navStyle(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <MessageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mensagens Livres" primaryTypographyProps={{ fontWeight: 300, fontSize: '0.875rem' }} />
                  {openFree ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openFree} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding sx={{ pl: 4, pr: 1 }}>
                    <ListItemButton
                      onClick={() => handleNav('/free')}
                      selected={isMtActive('FREE')}
                      sx={{ ...navStyle(isMtActive('FREE')), py: 0.5 }}
                    >
                      <ListItemText
                        primary="MT199 / MT299 / MT999"
                        secondary="Free Format Message"
                        primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>
              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMensagens(!openMensagens);
                  }}
                  sx={navStyle(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <MessageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mensagens" primaryTypographyProps={{ fontWeight: 300, fontSize: '0.875rem' }} />
                  {openMensagens ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openMensagens} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {MENSAGENS_GROUPS.map((g) => (
                    <ListItem key={g.route} disablePadding sx={{ pl: 4, pr: 1 }}>
                      <ListItemButton
                        onClick={() => handleNav(g.route === 'MT109' ? '/mt109' : `/messages/${g.route}`)}
                        selected={g.codes.some((c) => isMtActive(c))}
                        sx={{ ...navStyle(g.codes.some((c) => isMtActive(c))), py: 0.5 }}
                      >
                        <ListItemText
                          primary={g.label}
                          secondary={g.secondary}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                          secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {MENSAGENS.filter((mt) => !MENSAGENS_GROUPS.some((g) => g.codes.includes(mt.code)) && !['MT199', 'MT299', 'MT999'].includes(mt.code)).map((mt) => {
                    const active = location.pathname === `/messages/${mt.code}`;
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => handleNav(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTesouraria(!openTesouraria);
                  }}
                  sx={navStyle(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <PaymentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tesouraria/FX (MT3xx)" primaryTypographyProps={{ fontWeight: 300, fontSize: '0.875rem' }} />
                  {openTesouraria ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openTesouraria} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {TESOURARIA_GROUPS.map((g) => (
                    <ListItem key={g.route} disablePadding sx={{ pl: 4, pr: 1 }}>
                      <ListItemButton
                        onClick={() => handleNav(`/messages/${g.route}`)}
                        selected={g.codes.some((c) => isMtActive(c))}
                        sx={{ ...navStyle(g.codes.some((c) => isMtActive(c))), py: 0.5 }}
                      >
                        <ListItemText
                          primary={g.label}
                          secondary={g.secondary}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                          secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {TESOURARIA_FX.filter((mt) => !TESOURARIA_GROUPS.some((g) => g.codes.includes(mt.code))).map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => handleNav(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTrade(!openTrade);
                  }}
                  sx={navStyle(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <MessageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Trade/Collections (MT4xx)" primaryTypographyProps={{ fontWeight: 300, fontSize: '0.875rem' }} />
                  {openTrade ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openTrade} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {TRADE_GROUPS.map((g) => (
                    <ListItem key={g.route} disablePadding sx={{ pl: 4, pr: 1 }}>
                      <ListItemButton
                        onClick={() => handleNav(`/messages/${g.route}`)}
                        selected={g.codes.some((c) => isMtActive(c))}
                        sx={{ ...navStyle(g.codes.some((c) => isMtActive(c))), py: 0.5 }}
                      >
                        <ListItemText
                          primary={g.label}
                          secondary={g.secondary}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                          secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {TRADE_COLLECTIONS.filter((mt) => !TRADE_GROUPS.some((g) => g.codes.includes(mt.code))).map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => handleNav(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              <ListItem disablePadding sx={{ px: 1, mt: 0.5 }}>
                <ListItemButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSecurities(!openSecurities);
                  }}
                  sx={navStyle(false)}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#6B6B6B' }}>
                    <AccountBalanceIcon />
                  </ListItemIcon>
                  <ListItemText primary="Securities (MT5xx)" primaryTypographyProps={{ fontWeight: 300, fontSize: '0.875rem' }} />
                  {openSecurities ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openSecurities} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {SECURITIES_GROUPS.map((g) => (
                    <ListItem key={g.route} disablePadding sx={{ pl: 4, pr: 1 }}>
                      <ListItemButton
                        onClick={() => handleNav(`/messages/${g.route}`)}
                        selected={g.codes.some((c) => isMtActive(c))}
                        sx={{ ...navStyle(g.codes.some((c) => isMtActive(c))), py: 0.5 }}
                      >
                        <ListItemText
                          primary={g.label}
                          secondary={g.secondary || undefined}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                          secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {SECURITIES.filter((mt) => !SECURITIES_GROUPS.some((g) => g.codes.includes(mt.code))).map((mt) => {
                    const active = isMtActive(mt.code);
                    return (
                      <ListItem key={mt.code} disablePadding sx={{ pl: 4, pr: 1 }}>
                        <ListItemButton
                          onClick={() => handleNav(`/messages/${mt.code}`)}
                          selected={active}
                          sx={{ ...navStyle(active), py: 0.5 }}
                        >
                          <ListItemText
                            primary={mt.label}
                            secondary={mt.fullName}
                            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 300 }}
                            secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, fontWeight: 300 }}
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
                  onClick={() => handleNav(item.path)}
                  selected={active}
                  sx={navStyle(active)}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 300 }} />}
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
