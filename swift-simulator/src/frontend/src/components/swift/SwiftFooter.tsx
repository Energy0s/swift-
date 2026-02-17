/**
 * SwiftFooter — Bottom Bar do módulo SWIFT
 * Uma linha: Traffic, Shortcuts, Version, Links, Legal
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSwiftFooter, type SwiftFooterData } from '../../services/swiftHeaderService';

interface SwiftTrafficMiniProps {
  sent: number;
  received: number;
  nack: number;
  holds: number;
}

function SwiftTrafficMini({ sent, received, nack, holds }: SwiftTrafficMiniProps) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', gap: 1.5 }}>
      <Typography component="span" variant="caption">
        Sent: {sent}
      </Typography>
      <Typography component="span" variant="caption">
        Received: {received}
      </Typography>
      <Typography component="span" variant="caption" className={nack > 0 ? 'swift-traffic-nack' : ''}>
        NACK: {nack}
      </Typography>
      <Typography component="span" variant="caption" className={holds > 0 ? 'swift-traffic-holds' : ''}>
        Holds: {holds}
      </Typography>
    </Box>
  );
}

interface SwiftBuildInfoProps {
  version: string;
  commit: string;
}

function SwiftBuildInfo({ version, commit }: SwiftBuildInfoProps) {
  return (
    <Typography component="span" variant="caption" fontFamily="monospace">
      v{version} ({commit})
    </Typography>
  );
}

interface SwiftFooterLinksProps {
  onNavigate: (path: string) => void;
}

function SwiftFooterLinks({ onNavigate }: SwiftFooterLinksProps) {
  const linkSx = { cursor: 'pointer', color: 'inherit', '&:hover': { textDecoration: 'underline' } };
  return (
    <Box component="span" sx={{ display: 'inline-flex', gap: 1.5 }}>
      <Typography component="span" variant="caption" className="swift-link" sx={linkSx} onClick={() => onNavigate('/swift/runbook')}>
        Runbook
      </Typography>
      <Typography component="span" variant="caption" className="swift-link" sx={linkSx} onClick={() => onNavigate('/swift/audit')}>
        Audit Log
      </Typography>
      <Typography component="span" variant="caption" className="swift-link" sx={linkSx} onClick={() => onNavigate('/swift/support')}>
        Support
      </Typography>
    </Box>
  );
}

const SwiftFooter: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SwiftFooterData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFooter = useCallback(() => {
    getSwiftFooter()
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    fetchFooter();
    pollRef.current = setInterval(fetchFooter, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchFooter]);

  useEffect(() => {
    const onFocus = () => fetchFooter();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchFooter]);

  const d = data;
  const traffic = d?.traffic15m ?? { sentCount: 0, receivedCount: 0, nackCount: 0, holdsCount: 0 };
  const version = d?.build?.version ?? 'N/A';
  const commit = d?.build?.commit ?? 'N/A';

  return (
    <Box
      className="swift-footer"
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1,
        bgcolor: 'var(--swift-bg-subtle, #F2F2F2)',
        borderTop: '1px solid var(--swift-border, rgba(0,0,0,0.12))',
        fontSize: '0.75rem',
        color: 'var(--swift-text-muted, #666666)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <SwiftTrafficMini
        sent={traffic.sentCount}
        received={traffic.receivedCount}
        nack={traffic.nackCount}
        holds={traffic.holdsCount}
      />
      <Typography variant="caption" className="swift-muted" sx={{ color: 'var(--swift-text-muted, #666666)' }}>
        Ctrl/Cmd+K Search - Ctrl/Cmd+P Print Receipt
      </Typography>
      <SwiftBuildInfo version={version} commit={commit} />
      <SwiftFooterLinks onNavigate={navigate} />
      <Typography variant="caption" className="swift-muted" sx={{ color: 'var(--swift-text-muted, #666666)', fontSize: '0.7rem' }}>
        Confidential - For authorized personnel only
      </Typography>
    </Box>
  );
};

export default SwiftFooter;
