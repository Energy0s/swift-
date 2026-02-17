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
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { mt109Api, type Mt109CreatePayload, type Mt109Message, type Mt109Cheque, type Mt109Type } from '../services/mt109Service';
import { useToast } from '../contexts/ToastContext';
import BankLookupButton from '../components/forms/BankLookupButton';
import { validateField20, validateField21 } from '../utils/swiftValidation';

const MT109_TYPES: Mt109Type[] = ['MT109', 'MT110'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'CAD', 'AUD', 'CNY', 'MXN'];
const CHARGES_TYPES = ['OUR', 'SHA', 'BEN'] as const;

const emptyCheque = (): Mt109Cheque => ({
  chequeNumber: '',
  chequeAmount: 0,
  currency: 'EUR',
  chequeIssueDate: new Date().toISOString().slice(0, 10),
  draweeBankName: '',
  draweeBankBic: '',
  payeeName: '',
  payeeAddress: '',
  placeOfIssue: '',
});

const Mt109FormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Mt109CreatePayload>({
    mtType: 'MT109',
    transactionReferenceNumber: `REF${Date.now()}`.substring(0, 16),
    relatedReference: '',
    dateOfIssue: new Date().toISOString().slice(0, 10),
    orderingInstitution: '',
    orderingCustomer: {},
    beneficiary: {},
    cheques: [emptyCheque()],
    detailsOfCharges: 'OUR',
  });

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      mt109Api
        .get(Number(id))
        .then((r) => {
          const m = r.data?.data?.message as Mt109Message;
          if (m) {
            setForm({
              mtType: (m.mtType as Mt109Type) || 'MT109',
              swiftHeader: m.swiftHeader,
              transactionReferenceNumber: m.transactionReferenceNumber,
              relatedReference: m.relatedReference,
              dateOfIssue: m.dateOfIssue,
              orderingInstitution: m.orderingInstitution,
              orderingCustomer: m.orderingCustomer || {},
              beneficiary: m.beneficiary || {},
              cheques: m.cheques?.length ? m.cheques.map((c) => ({
                id: c.id,
                chequeNumber: c.chequeNumber,
                chequeAmount: c.chequeAmount,
                currency: c.currency,
                chequeIssueDate: c.chequeIssueDate || m.dateOfIssue,
                draweeBankName: c.draweeBankName,
                draweeBankBic: c.draweeBankBic,
                payeeName: c.payeeName,
                payeeAddress: c.payeeAddress,
                placeOfIssue: c.placeOfIssue,
                remittanceInformation: c.remittanceInformation,
                senderToReceiverInfo: c.senderToReceiverInfo,
              })) : [emptyCheque()],
              detailsOfCharges: (m.detailsOfCharges as 'OUR' | 'SHA' | 'BEN') || 'OUR',
            });
          }
        })
        .catch(() => showError('Mensagem não encontrada'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const update = (path: string, value: unknown) => {
    setForm((prev) => {
      const parts = path.split('.');
      const key = parts[parts.length - 1];
      if (parts.length === 1) {
        return { ...prev, [key]: value };
      }
      const setNested = (obj: Record<string, unknown>, p: string[], v: unknown): Record<string, unknown> => {
        const [head, ...rest] = p;
        if (rest.length === 0) {
          return { ...obj, [head]: v };
        }
        const child = (obj[head] && typeof obj[head] === 'object' ? { ...(obj[head] as Record<string, unknown>) } : {}) as Record<string, unknown>;
        return { ...obj, [head]: setNested(child, rest, v) };
      };
      return setNested({ ...prev } as Record<string, unknown>, parts, value) as Mt109CreatePayload;
    });
  };

  const updateCheque = (idx: number, key: keyof Mt109Cheque, value: unknown) => {
    setForm((prev) => {
      const cheques = [...(prev.cheques || [])];
      cheques[idx] = { ...cheques[idx], [key]: value };
      return { ...prev, cheques };
    });
  };

  const addCheque = () => {
    setForm((prev) => ({
      ...prev,
      cheques: [...(prev.cheques || []), emptyCheque()],
    }));
  };

  const removeCheque = (idx: number) => {
    setForm((prev) => {
      const cheques = prev.cheques?.filter((_, i) => i !== idx) || [];
      return { ...prev, cheques: cheques.length ? cheques : [emptyCheque()] };
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const e20 = validateField20(form.transactionReferenceNumber || '');
    if (e20) errs.push(e20);
    const e21 = validateField21(form.relatedReference);
    if (e21) errs.push(e21);
    if (!form.dateOfIssue) errs.push(':30: Date of Issue é obrigatório');
    const ord = form.orderingCustomer;
    if (!ord?.orderingName?.trim() && !ord?.orderingAccountNumber?.trim()) {
      errs.push(':50: Ordering Customer (nome ou conta) é obrigatório');
    }
    const ben = form.beneficiary;
    if (!ben?.beneficiaryName?.trim() && !ben?.beneficiaryAccount?.trim()) {
      errs.push(':59: Beneficiary (nome ou conta) é obrigatório');
    }
    if (!form.cheques?.length) errs.push('Pelo menos 1 cheque é obrigatório');
    form.cheques?.forEach((ch, i) => {
      if (!ch.chequeNumber?.trim()) errs.push(`Cheque ${i + 1}: Cheque Number é obrigatório`);
      if (!ch.currency) errs.push(`Cheque ${i + 1}: Currency é obrigatório`);
      if (!ch.chequeAmount || ch.chequeAmount <= 0) errs.push(`Cheque ${i + 1}: Amount deve ser > 0`);
    });
    if (!form.detailsOfCharges) errs.push(':71A: Details of Charges (OUR/SHA/BEN) é obrigatório');
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
        cheques: form.cheques?.map((c) => ({
          id: c.id,
          chequeNumber: c.chequeNumber,
          chequeAmount: c.chequeAmount,
          currency: c.currency,
          chequeIssueDate: c.chequeIssueDate || form.dateOfIssue,
          draweeBankName: c.draweeBankName || undefined,
          draweeBankBic: c.draweeBankBic || undefined,
          payeeName: c.payeeName || undefined,
          payeeAddress: c.payeeAddress || undefined,
          placeOfIssue: c.placeOfIssue || undefined,
          remittanceInformation: c.remittanceInformation || undefined,
          senderToReceiverInfo: c.senderToReceiverInfo || undefined,
        })),
      };
      if (isEdit) {
        await mt109Api.update(Number(id), payload);
        showSuccess('MT109 atualizada com sucesso');
        navigate(`/mt109/${id}`);
      } else {
        const r = await mt109Api.create(payload);
        const msg = r.data?.data?.message;
        showSuccess('MT109 criada com sucesso');
        navigate(`/mt109/${msg?.id}`);
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
      <Button startIcon={<BackIcon />} onClick={() => navigate(isEdit ? `/mt109/${id}` : '/mt109')} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Aviso de Cheque(s) — {isEdit ? 'Editar' : 'Nova mensagem'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        MT109 / MT110
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Identificação</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>MT Type</InputLabel>
            <Select
              value={form.mtType || 'MT109'}
              onChange={(e) => update('mtType', e.target.value)}
              label="MT Type"
            >
              {MT109_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Basic Message Data</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            label=":20 Transaction Reference (obrigatório)"
            value={form.transactionReferenceNumber || ''}
            onChange={(e) => update('transactionReferenceNumber', e.target.value.replace(/[^a-zA-Z0-9/\-?:().,'+ ]/g, '').substring(0, 16))}
            required
          />
          <TextField
            fullWidth
            label=":21 Related Reference"
            value={form.relatedReference || ''}
            onChange={(e) => update('relatedReference', e.target.value.replace(/[^a-zA-Z0-9/\-?:().,'+ ]/g, '').substring(0, 16))}
          />
          <TextField
            fullWidth
            type="date"
            label=":30 Date of Issue (obrigatório)"
            value={form.dateOfIssue || ''}
            onChange={(e) => update('dateOfIssue', e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControl fullWidth>
            <InputLabel>:71A Details of Charges (obrigatório)</InputLabel>
            <Select
              value={form.detailsOfCharges || 'OUR'}
              onChange={(e) => update('detailsOfCharges', e.target.value)}
              label=":71A Details of Charges (obrigatório)"
            >
              {CHARGES_TYPES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label=":52A Ordering Institution (BIC) — Banco receptor"
              value={form.orderingInstitution || ''}
              onChange={(e) => update('orderingInstitution', e.target.value.replace(/\s/g, '').toUpperCase())}
              sx={{ flex: 1 }}
            />
            <BankLookupButton
              bic={form.orderingInstitution || ''}
              size="medium"
              label="Buscar Banco"
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Ordering Customer (:50)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Ordering Name"
            value={form.orderingCustomer?.orderingName || ''}
            onChange={(e) => update('orderingCustomer.orderingName', e.target.value)}
          />
          <TextField
            fullWidth
            label="Ordering Account Number"
            value={form.orderingCustomer?.orderingAccountNumber || ''}
            onChange={(e) => update('orderingCustomer.orderingAccountNumber', e.target.value)}
          />
          <TextField
            fullWidth
            label="Address"
            value={form.orderingCustomer?.addressLine1 || ''}
            onChange={(e) => update('orderingCustomer.addressLine1', e.target.value)}
          />
          <TextField
            fullWidth
            label="Country"
            value={form.orderingCustomer?.country || ''}
            onChange={(e) => update('orderingCustomer.country', e.target.value)}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Beneficiary (:59)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Beneficiary Name"
            value={form.beneficiary?.beneficiaryName || ''}
            onChange={(e) => update('beneficiary.beneficiaryName', e.target.value)}
          />
          <TextField
            fullWidth
            label="Beneficiary Account"
            value={form.beneficiary?.beneficiaryAccount || ''}
            onChange={(e) => update('beneficiary.beneficiaryAccount', e.target.value)}
          />
          <TextField
            fullWidth
            label="Address"
            value={form.beneficiary?.addressLine1 || ''}
            onChange={(e) => update('beneficiary.addressLine1', e.target.value)}
          />
          <TextField
            fullWidth
            label="Country"
            value={form.beneficiary?.country || ''}
            onChange={(e) => update('beneficiary.country', e.target.value)}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">Cheques (repetível)</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addCheque}>
            Adicionar Cheque
          </Button>
        </Box>
        {form.cheques?.map((ch, idx) => (
          <Box key={idx} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption">Cheque {idx + 1}</Typography>
              {form.cheques!.length > 1 && (
                <IconButton size="small" onClick={() => removeCheque(idx)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Cheque Number (obrigatório)"
                value={ch.chequeNumber || ''}
                onChange={(e) => updateCheque(idx, 'chequeNumber', e.target.value)}
                required
              />
              <FormControl fullWidth size="small">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={ch.currency || 'EUR'}
                  onChange={(e) => updateCheque(idx, 'currency', e.target.value)}
                  label="Currency"
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount (obrigatório)"
                value={ch.chequeAmount || ''}
                onChange={(e) => updateCheque(idx, 'chequeAmount', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Issue Date"
                value={ch.chequeIssueDate || form.dateOfIssue || ''}
                onChange={(e) => updateCheque(idx, 'chequeIssueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                size="small"
                label="Drawee Bank Name"
                value={ch.draweeBankName || ''}
                onChange={(e) => updateCheque(idx, 'draweeBankName', e.target.value)}
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Drawee Bank BIC — Banco receptor"
                  value={ch.draweeBankBic || ''}
                  onChange={(e) => updateCheque(idx, 'draweeBankBic', e.target.value.replace(/\s/g, '').toUpperCase())}
                  sx={{ flex: 1 }}
                />
                <BankLookupButton
                  bic={ch.draweeBankBic || ''}
                  size="small"
                  label="Buscar Banco"
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Payee Name"
                value={ch.payeeName || ''}
                onChange={(e) => updateCheque(idx, 'payeeName', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Place of Issue"
                value={ch.placeOfIssue || ''}
                onChange={(e) => updateCheque(idx, 'placeOfIssue', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label=":70 Remittance (máx 140)"
                value={ch.remittanceInformation || ''}
                onChange={(e) => updateCheque(idx, 'remittanceInformation', e.target.value.substring(0, 140))}
              />
            </Box>
          </Box>
        ))}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : isEdit ? 'Salvar' : 'Criar MT109'}
        </Button>
      </Box>
    </Box>
  );
};

export default Mt109FormPage;
