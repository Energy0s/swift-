import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { ArrowBack as BackIcon, CloudUpload as IngestIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { incomingApi } from '../services/incomingService';
import { useToast } from '../contexts/ToastContext';

const SAMPLE_MT199 = `{1:F01BOMGBRS1XXX0000000000}{2:I199BOMGBRS1XXXXN}{3:{121:550e8400-e29b-41d4-a716-446655440000}}{4:
:20:REF123456
:21:REL789
:79:Teste de mensagem livre MT199
- Fim da mensagem
}{5:}`;

const SAMPLE_MT103 = `{1:F01BOMGBRS1XXX0000000000}{2:I103BOMGBRS1XXXXN}{4:
:20:REF20240215001
:23B:CRED
:32A:240215EUR1500,00
:50K:/DE89370400440532013000
John Doe
:59:/FR7630006000011234567890189
Jane Smith
:70:Payment for services
}{5:}`;

const IngestIncomingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [rawPayload, setRawPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  const handleIngest = async () => {
    if (!rawPayload.trim()) {
      showError('Informe o raw_payload para ingestão.');
      return;
    }
    setLoading(true);
    setCreatedId(null);
    setParseStatus(null);
    try {
      const r = await incomingApi.ingest({
        raw_payload: rawPayload.trim(),
        ingest_source: 'API',
      });
      const msg = r.data?.data?.message;
      const parsed = r.data?.data?.parseResult?.parsed;
      if (msg?.id) {
        setCreatedId(msg.id);
        setParseStatus(parsed ? 'PARSED' : 'PARSE_ERROR');
        showSuccess('Mensagem recebida com sucesso.');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message || 'Erro ao ingerir mensagem.');
    } finally {
      setLoading(false);
    }
  };

  const insertSample = (sample: string) => {
    setRawPayload(sample);
    setCreatedId(null);
    setParseStatus(null);
  };

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/inbox')} sx={{ mb: 2 }}>
        Voltar
      </Button>

      <Typography variant="h5" fontWeight={600} gutterBottom>
        Receber Mensagem SWIFT
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cole o conteúdo bruto (RAW) da mensagem SWIFT para receber.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Exemplos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={() => insertSample(SAMPLE_MT199)}>
            MT199 simples
          </Button>
          <Button size="small" variant="outlined" onClick={() => insertSample(SAMPLE_MT103)}>
            MT103 com blocos
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          minRows={12}
          maxRows={24}
          label="Raw Payload (FIN)"
          value={rawPayload}
          onChange={(e) => {
            setRawPayload(e.target.value);
            setCreatedId(null);
            setParseStatus(null);
          }}
          placeholder="Cole aqui o conteúdo bruto da mensagem SWIFT..."
          sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IngestIcon />}
            onClick={handleIngest}
            disabled={loading || !rawPayload.trim()}
          >
            Ingest
          </Button>
        </Box>
      </Paper>

      {createdId && (
        <Alert severity={parseStatus === 'PARSE_ERROR' ? 'warning' : 'success'} sx={{ mb: 2 }}>
          Mensagem recebida. ID: {createdId}
          {parseStatus === 'PARSE_ERROR' && ' — Houve erros no parse, mas o RAW foi preservado.'}
          <Box sx={{ mt: 1 }}>
            <Link component="button" variant="body2" onClick={() => navigate(`/inbox/${createdId}`)}>
              Abrir mensagem
            </Link>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default IngestIncomingPage;
