import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { mtFreeApi, type MtFreeCreatePayload, type MtFreeMessage } from '../services/mtFreeService';
import { useToast } from '../contexts/ToastContext';
import BankLookupButton from '../components/forms/BankLookupButton';
import { validateField20, validateField21, validateSwiftTextX } from '../utils/swiftValidation';

const MT_TYPES = ['MT199', 'MT299', 'MT999'] as const;
const NARRATIVE_MAX = 3500;

const MtFreeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<MtFreeCreatePayload>({
    mtType: 'MT199',
    receiverBic: '',
    transactionReferenceNumber: `REF${Date.now()}`.substring(0, 35),
    relatedReference: '',
    narrativeFreeText: '',
    senderToReceiverInfo: '',
  });

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      mtFreeApi
        .get(Number(id))
        .then((r) => {
          const m = r.data?.data?.message as MtFreeMessage;
          if (m) {
            setForm({
              mtType: m.mtType,
              receiverBic: m.swiftHeader?.receiverBic || '',
              swiftHeader: m.swiftHeader,
              transactionReferenceNumber: m.transactionReferenceNumber,
              relatedReference: m.relatedReference,
              narrativeFreeText: m.narrativeFreeText,
              originalMessageMt: m.originalMessageMt,
              originalMessageDate: m.originalMessageDate,
              senderToReceiverInfo: m.senderToReceiverInfo,
            });
          }
        })
        .catch(() => showError('Mensagem não encontrada'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const update = (key: keyof MtFreeCreatePayload, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.mtType) errs.push('MT Type é obrigatório');
    if (!form.receiverBic?.trim()) errs.push('Receiver BIC é obrigatório');
    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test((form.receiverBic || '').replace(/\s/g, ''))) {
      errs.push('Receiver BIC deve ter 8 ou 11 caracteres (formato BIC)');
    }
    if (!form.transactionReferenceNumber?.trim()) errs.push(':20 Transaction Reference é obrigatório');
    if (!form.narrativeFreeText?.trim()) errs.push(':79 Narrative / Free Text é obrigatório');
    if (form.narrativeFreeText && form.narrativeFreeText.length > NARRATIVE_MAX) {
      errs.push(`:79 Narrative máximo ${NARRATIVE_MAX} caracteres`);
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length > 0) {
      showError(errs[0]);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        receiverBic: (form.receiverBic || '').replace(/\s/g, '').toUpperCase(),
      };
      if (isEdit) {
        await mtFreeApi.update(Number(id), payload);
        showSuccess('Mensagem atualizada com sucesso');
        navigate(`/free/${id}`);
      } else {
        const r = await mtFreeApi.create(payload);
        const msg = r.data?.data?.message;
        showSuccess('Mensagem criada com sucesso');
        navigate(`/free/${msg?.id}`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate(isEdit ? `/free/${id}` : '/free')} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Mensagem Livre — {isEdit ? 'Editar' : 'Nova'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        MT199 / MT299 / MT999
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Identificação</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>MT Type</InputLabel>
            <Select
              value={form.mtType || 'MT199'}
              onChange={(e) => update('mtType', e.target.value)}
              label="MT Type"
            >
              {MT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              label="Receiver BIC (obrigatório) — Banco receptor"
              value={form.receiverBic || ''}
              onChange={(e) => update('receiverBic', e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder="XXXXXXXX ou XXXXXXXXXXX"
              required
              sx={{ flex: 1 }}
            />
            <BankLookupButton
              bic={form.receiverBic || ''}
              size="medium"
              label="Buscar Banco"
            />
          </Box>
          <TextField
            fullWidth
            label=":20 Transaction Reference (obrigatório)"
            value={form.transactionReferenceNumber || ''}
            onChange={(e) => update('transactionReferenceNumber', e.target.value.replace(/[^a-zA-Z0-9/\-?:().,'+ ]/g, '').substring(0, 35))}
            required
          />
          <TextField
            fullWidth
            label=":21 Related Reference"
            value={form.relatedReference || ''}
            onChange={(e) => update('relatedReference', e.target.value.replace(/[^a-zA-Z0-9/\-?:().,'+ ]/g, '').substring(0, 35))}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={form.swiftHeader?.messagePriority || 'N'}
              onChange={(e) => update('swiftHeader', { ...form.swiftHeader, messagePriority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="N">N (Normal)</MenuItem>
              <MenuItem value="U">U (Urgent)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>:79 Narrative / Free Text (obrigatório)</Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={20}
          label="Texto livre"
          value={form.narrativeFreeText || ''}
          onChange={(e) => update('narrativeFreeText', e.target.value.replace(/[^a-zA-Z0-9/\-?:().,'+ \r\n]/g, ' ').substring(0, NARRATIVE_MAX))}
          helperText={`${(form.narrativeFreeText || '').length}/${NARRATIVE_MAX}`}
          required
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>:72 Sender to Receiver Information</Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Opcional"
          value={form.senderToReceiverInfo || ''}
          onChange={(e) => update('senderToReceiverInfo', e.target.value.substring(0, 140))}
          helperText={`${(form.senderToReceiverInfo || '').length}/140`}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </Box>
    </Box>
  );
};

export default MtFreeFormPage;
