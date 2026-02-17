import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAccounts } from '../services/accountsService';
import { validateIban, validateBic } from '../services/validateService';
import { createMessage } from '../services/messagesService';
import type { Account } from '../services/accountsService';
import { getMtByCode, getGroupByRoute, getGroupByCode } from '../constants/swiftMtTypes';
import { MT_FORM_SCHEMAS, type FormField } from '../constants/mtFormSchemas';
import BicField from '../components/forms/BicField';
import { useToast } from '../contexts/ToastContext';

const formatIban = (v: string) => {
  const c = (v || '').replace(/\s/g, '').toUpperCase();
  return c.replace(/(.{4})/g, '$1 ').trim();
};

const MessageFormPage: React.FC = () => {
  const { mtCode } = useParams<{ mtCode: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bicValid, setBicValid] = useState<Record<string, boolean | null>>({});
  const [ibanValid, setIbanValid] = useState<Record<string, boolean | null>>({});
  const [bankInfo, setBankInfo] = useState<Record<string, { name?: string; city?: string; country?: string } | null>>({});

  const group = mtCode ? (getGroupByRoute(mtCode) ?? getGroupByCode(mtCode)) : null;
  const schema = mtCode ? MT_FORM_SCHEMAS[mtCode] : null;
  const mtInfo = mtCode ? getMtByCode(mtCode) : null;

  useEffect(() => {
    getAccounts()
      .then((r) => setAccounts(r.data?.data?.accounts ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (schema && !formData.referenceNumber) {
      setFormData((prev) => ({
        ...prev,
        referenceNumber: `REF${Date.now()}`.substring(0, 16),
        currency: 'EUR',
      }));
    }
  }, [schema]);
  useEffect(() => {
    if (group && !formData.mtType) {
      setFormData((prev) => ({ ...prev, mtType: group.codes[0] }));
    }
  }, [group]);

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleIbanBlur = async (key: string) => {
    const iban = (formData[key] as string)?.replace(/\s/g, '') || '';
    if (iban.length < 15) {
      setIbanValid((prev) => ({ ...prev, [key]: null }));
      return;
    }
    try {
      const res = await validateIban(iban);
      setIbanValid((prev) => ({ ...prev, [key]: res.data?.data?.valid ?? false }));
    } catch {
      setIbanValid((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleBicBlur = async (key: string) => {
    const bic = (formData[key] as string)?.replace(/\s/g, '') || '';
    if (bic.length < 8) {
      setBicValid((prev) => ({ ...prev, [key]: null }));
      setBankInfo((prev) => ({ ...prev, [key]: null }));
      return;
    }
    try {
      const res = await validateBic(bic);
      const d = res.data?.data;
      setBicValid((prev) => ({ ...prev, [key]: d?.valid ?? false }));
      setBankInfo((prev) => ({
        ...prev,
        [key]: d?.valid && (d?.bankName || d?.city || d?.country)
          ? { name: d.bankName ?? undefined, city: d.city ?? undefined, country: d.country ?? undefined }
          : null,
      }));
    } catch {
      setBicValid((prev) => ({ ...prev, [key]: false }));
      setBankInfo((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleValidateAll = async () => {
    if (!schema) return;
    for (const f of schema.fields) {
      if (f.type === 'iban' || f.key.toLowerCase().includes('iban')) {
        await handleIbanBlur(f.key);
      }
      if (f.type === 'bic' || f.key.toLowerCase().includes('bic')) {
        await handleBicBlur(f.key);
      }
    }
  };

  const handleAccountSelect = (accountId: number) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) {
      setFormData((prev) => ({
        ...prev,
        sourceAccountId: accountId,
        sourceIban: acc.iban,
        sourceBic: acc.bic,
        sourceHolderName: user?.name || acc.accountNumber,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!schema) return false;
    for (const f of schema.fields) {
      if (f.required) {
        const v = formData[f.key];
        if (v === undefined || v === null || v === '') return false;
      }
      if ((f.type === 'bic' || f.key.toLowerCase().includes('bic')) && formData[f.key]) {
        const valid = bicValid[f.key];
        if (valid === false) return false;
      }
      if ((f.type === 'iban' || f.key.toLowerCase().includes('iban')) && formData[f.key]) {
        const valid = ibanValid[f.key];
        if (valid === false) return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!mtCode || !schema) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of schema.fields) {
        const v = formData[f.key];
        if (v !== undefined && v !== null && v !== '') {
          if (f.type === 'number') payload[f.key] = Number(v);
          else if (f.type === 'iban') payload[f.key] = (v as string).replace(/\s/g, '');
          else payload[f.key] = v;
        }
      }
      const messageType = (group ? (formData.mtType as string) || group.codes[0] : mtCode) as any;
      const res = await createMessage(messageType, payload);
      const msg = res.data?.data?.message;
      setConfirmOpen(false);
      showSuccess(
        `Mensagem ${messageType} criada com sucesso`,
        msg?.referenceNumber ?? '',
        () => navigate(`/messages/view/${msg?.id}`),
        'Ver mensagem'
      );
      navigate(`/messages/view/${msg?.id}`);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Erro ao gerar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f: FormField) => {
    const value = formData[f.key];
    const hasBic = f.key.includes('Bic') || f.key.includes('bic');
    const hasIban = f.key.includes('Iban') || f.key.includes('iban');

    if (f.type === 'bic' || hasBic) {
      return (
        <Box key={f.key} sx={{ mb: 2 }}>
          <BicField
            label={f.label}
            value={(value as string) || ''}
            onChange={(v) => handleChange(f.key, v)}
            onBlur={() => handleBicBlur(f.key)}
            error={bicValid[f.key] === false}
            helperText={bicValid[f.key] === true ? 'BIC válido' : bicValid[f.key] === false ? 'BIC inválido' : f.helperText}
            bankInfo={bankInfo[f.key]}
          />
        </Box>
      );
    }

    if (f.type === 'iban' || hasIban) {
      const ibanStatus = ibanValid[f.key];
      const helper = ibanStatus === true ? 'IBAN válido' : ibanStatus === false ? 'IBAN inválido' : f.helperText;
      return (
        <TextField
          key={f.key}
          fullWidth
          label={f.label}
          value={formatIban((value as string) || '')}
          onChange={(e) => handleChange(f.key, e.target.value.replace(/\s/g, ''))}
          onBlur={() => handleIbanBlur(f.key)}
          required={f.required}
          error={ibanStatus === false}
          helperText={helper}
          sx={{ mb: 2 }}
        />
      );
    }

    if (f.type === 'select') {
      return (
        <TextField
          key={f.key}
          fullWidth
          select
          label={f.label}
          value={(value as string) || ''}
          onChange={(e) => handleChange(f.key, e.target.value)}
          required={f.required}
          helperText={f.helperText}
          sx={{ mb: 2 }}
        >
          {(f.options || []).map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (f.type === 'textarea') {
      return (
        <TextField
          key={f.key}
          fullWidth
          multiline
          rows={3}
          label={f.label}
          value={(value as string) || ''}
          onChange={(e) => handleChange(f.key, e.target.value)}
          required={f.required}
          helperText={f.helperText}
          sx={{ mb: 2 }}
        />
      );
    }

    if (f.type === 'number') {
      return (
        <TextField
          key={f.key}
          fullWidth
          type="number"
          label={f.label}
          value={(value as number) ?? ''}
          onChange={(e) => handleChange(f.key, e.target.value ? parseFloat(e.target.value) : '')}
          inputProps={{ min: 0, step: 0.01 }}
          required={f.required}
          helperText={f.helperText}
          sx={{ mb: 2 }}
        />
      );
    }

    return (
      <TextField
        key={f.key}
        fullWidth
        label={f.label}
        value={(value as string) || ''}
        onChange={(e) => handleChange(f.key, e.target.value)}
        required={f.required}
        helperText={f.helperText}
        placeholder={f.placeholder}
        sx={{ mb: 2 }}
      />
    );
  };

  if (loading || !mtCode) {
    return (
      <Box>
        <Skeleton width={280} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (!schema || !mtInfo) {
    return (
      <Box>
        <Typography color="error">Tipo MT não encontrado: {mtCode}</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  const needsAccount = schema.fields.some((f) => f.key === 'sourceIban' || f.key === 'sourceBic');

  return (
    <Box>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {group?.secondary || `${mtInfo.label} — ${mtInfo.fullName}`}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {group?.label || mtInfo.label}
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        {group && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>MT Type</InputLabel>
            <Select
              value={(formData.mtType as string) || group.codes[0]}
              onChange={(e) => handleChange('mtType', e.target.value)}
              label="MT Type"
            >
              {group.codes.map((c) => {
                const info = getMtByCode(c);
                return (
                  <MenuItem key={c} value={c}>
                    {c} {info ? `— ${info.fullName}` : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}
        {needsAccount && accounts.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Debitar de (conta)</InputLabel>
            <Select
              value={formData.sourceAccountId ?? ''}
              onChange={(e) => handleAccountSelect(Number(e.target.value))}
              label="Debitar de (conta)"
            >
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.accountNumber} — {a.balance.toFixed(2)} {a.currency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {schema.fields.map((f) => renderField(f))}

        {(schema.fields.some((f) => f.type === 'iban' || f.type === 'bic' || f.key.toLowerCase().includes('iban') || f.key.toLowerCase().includes('bic')) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={handleValidateAll}>
              Validar IBAN e BIC
            </Button>
          </Box>
        ))}

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!validateForm()}
            onClick={() => setConfirmOpen(true)}
          >
            Gerar mensagem
          </Button>
        </Box>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar geração</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Confirmar geração da mensagem {mtInfo.label}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ref: {formData.referenceNumber}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Voltar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageFormPage;
