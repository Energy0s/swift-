/**
 * SwiftHeader — Top Bar do módulo SWIFT
 * LEFT: Logo, Ambiente, LT, BIC
 * CENTER: Busca global
 * RIGHT: Status, Filas, Alertas, Hora, Perfil
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  Select,
  FormControl,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSwiftHeader, swiftSearch, type SwiftHeaderData, type SwiftSearchType } from '../../services/swiftHeaderService';

const SWIFT_PATHS = [
  '/dashboard',
  '/inbox',
  '/transfer',
  '/mt101',
  '/mt103',
  '/mt109',
  '/free',
  '/messages',
  '/swift',
];

function isSwiftPath(path: string): boolean {
  return SWIFT_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

const SEARCH_TYPES: { value: SwiftSearchType; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'REF20', label: 'Referência (:20)' },
  { value: 'UETR', label: 'UETR' },
  { value: 'BIC', label: 'BIC' },
  { value: 'MT', label: 'Tipo MT' },
  { value: 'STATUS', label: 'Status' },
];

interface SwiftHeaderProps {
  onMenuClick?: () => void;
}

const SwiftHeader: React.FC<SwiftHeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [data, setData] = useState<SwiftHeaderData | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchType, setSearchType] = useState<SwiftSearchType>('ALL');
  const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);
  const [anchorAlerts, setAnchorAlerts] = useState<null | HTMLElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHeader = useCallback(() => {
    getSwiftHeader()
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    fetchHeader();
    pollRef.current = setInterval(fetchHeader, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchHeader]);

  useEffect(() => {
    const onFocus = () => fetchHeader();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchHeader]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('swift-global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/swift/search?q=${encodeURIComponent(searchQ.trim())}&type=${searchType}`);
    }
  };

  const handleLogout = () => {
    setAnchorUser(null);
    logout();
  };

  const d = data;
  const env = d?.environment ?? 'N/A';
  const bic = d?.entityBic ?? 'N/A';
  const finStatus = d?.finStatus ?? 'N/A';
  const gwStatus = d?.gatewayStatus ?? 'N/A';
  const rmaStatus = d?.rmaStatus ?? 'N/A';
  const inboxCount = d?.queues?.inboxPending ?? 0;
  const outboxCount = d?.queues?.outboxPending ?? 0;
  const alertsCount = d?.alerts?.criticalCount ?? 0;
  const serverTime = d?.serverTime;
  const op = d?.operator;

  const formatServerTime = () => {
    if (!serverTime?.iso) return 'N/A';
    try {
      const d = new Date(serverTime.iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} ${h}:${min} (${serverTime.tz ?? 'N/A'})`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className="swift-header-appbar"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        component="div"
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: 2,
          py: 1,
          px: 2,
          minWidth: 0,
        }}
      >
        {isMobile && (
          <IconButton color="inherit" onClick={onMenuClick} edge="start" size="small" sx={{ flexShrink: 0 }}>
            <MenuIcon />
          </IconButton>
        )}
        <Chip label={env} size="small" sx={{ fontSize: '0.7rem', height: 22, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'var(--swift-text-muted, #666666)', whiteSpace: 'nowrap', flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
          BIC: {bic}
        </Typography>
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 180, maxWidth: 400, flex: '1 1 auto' }}
          role="search"
        >
          <FormControl size="small" variant="outlined" sx={{ minWidth: 100 }}>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SwiftSearchType)}
              displayEmpty
              sx={{ height: 40 }}
            >
              {SEARCH_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            id="swift-global-search"
            size="small"
            placeholder="Buscar por :20 / UETR / BIC / Tipo MT / Status"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'var(--swift-text-muted, #666666)' }} />
                </InputAdornment>
              ),
              sx: { bgcolor: 'var(--swift-bg, #FFFFFF)' },
            }}
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Box>
        <Tooltip title={`FIN: ${finStatus} | Gateway: ${gwStatus} | RMA: ${rmaStatus}`}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Typography variant="caption" className={finStatus === 'UP' ? 'swift-status-up' : 'swift-status-down'}>
                FIN: {finStatus}
              </Typography>
              <Typography variant="caption" className={gwStatus === 'UP' ? 'swift-status-up' : 'swift-status-down'}>
                GW: {gwStatus}
              </Typography>
          </Box>
        </Tooltip>
        <IconButton size="small" onClick={() => navigate('/inbox')} sx={{ color: 'var(--swift-text-muted, #666666)', flexShrink: 0 }}>
            <Badge badgeContent={inboxCount} color="primary" max={99}>
              <InboxIcon fontSize="small" />
            </Badge>
          </IconButton>
          <IconButton size="small" onClick={() => navigate('/swift/outbox')} sx={{ color: 'var(--swift-text-muted, #666666)', flexShrink: 0 }}>
            <Badge badgeContent={outboxCount} color="primary" max={99}>
              <OutboxIcon fontSize="small" />
            </Badge>
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => setAnchorAlerts(e.currentTarget)}
            sx={{ color: 'var(--swift-text-muted, #666666)', flexShrink: 0 }}
          >
            <Badge badgeContent={alertsCount} color="error" max={99}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={anchorAlerts}
            open={Boolean(anchorAlerts)}
            onClose={() => setAnchorAlerts(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {d?.alerts?.items?.length ? (
              d.alerts.items.map((a) => (
                <MenuItem key={a.id} dense>
                  <ListItemText primary={a.title} secondary={a.type} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <ListItemText primary="Nenhum alerta" primaryTypographyProps={{ fontSize: '0.8rem' }} />
              </MenuItem>
            )}
          </Menu>
          <Typography variant="caption" sx={{ color: 'var(--swift-text-muted, #666666)', fontFamily: 'monospace', display: { xs: 'none', lg: 'block' }, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {formatServerTime()}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => setAnchorUser(e.currentTarget)}
            sx={{ color: 'var(--swift-text, #333333)', display: 'flex', gap: 2, flexShrink: 0 }}
          >
            <PersonIcon />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {op?.nameShort ?? user?.name ?? 'N/A'}
            </Typography>
          </IconButton>
          <Menu
            anchorEl={anchorUser}
            open={Boolean(anchorUser)}
            onClose={() => setAnchorUser(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <ListItemText primary={op?.nameFull ?? user?.name ?? 'N/A'} secondary={op?.registration ? `Matrícula: ${op.registration}` : undefined} />
            </MenuItem>
            {op?.roles?.length ? (
              <MenuItem disabled>
                <ListItemText primary={op.roles.join(', ')} primaryTypographyProps={{ fontSize: '0.75rem' }} />
              </MenuItem>
            ) : null}
            {op?.lastLoginAt ? (
              <MenuItem disabled>
                <ListItemText primary={`Último login: ${new Date(op.lastLoginAt).toLocaleString('pt-BR')}`} primaryTypographyProps={{ fontSize: '0.75rem' }} />
              </MenuItem>
            ) : null}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Sair" />
            </MenuItem>
          </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default SwiftHeader;
export { isSwiftPath };
