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
import { mt103Api, type Mt103CreatePayload, type Mt103Message } from '../services/mt103Service';
import { useToast } from '../contexts/ToastContext';
import BankLookupButton from '../components/forms/BankLookupButton';
import { validateField20, validateSwiftTextX } from '../utils/swiftValidation';
import type { Mt103Type } from '../services/mt103Service';

const MT103_TYPES: Mt103Type[] = ['MT103', 'MT103REMIT', 'MT103STP'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'CAD', 'AUD', 'CNY', 'MXN'];
const BANK_OP_CODES = ['CRED', 'SPAY', 'SSTD', 'SPRI'] as const;
const CHARGES_TYPES = ['OUR', 'SHA', 'BEN'] as const;

const emptyPayload = (): Mt103CreatePayload => ({
  mtType: 'MT103',
  transactionReferenceNumber: `REF${Date.now()}`.substring(0, 16),
  bankOperationCode: 'CRED',
  valueDate: new Date().toISOString().slice(0, 10),
  currency: 'EUR',
  interbankSettledAmount: 0,
  orderingCustomer: {},
  beneficiaryCustomer: {},
  detailsOfCharges: 'OUR',
});

const Mt103FormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Mt103CreatePayload>(emptyPayload());

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      mt103Api
        .get(Number(id))
        .then((r) => {
          const m = r.data?.data?.message as Mt103Message;
          if (m) {
            setForm({
              mtType: (m.mtType as Mt103Type) || 'MT103',
              swiftHeader: m.swiftHeader as Record<string, string>,
              transactionReferenceNumber: m.transactionReferenceNumber,
              bankOperationCode: (m.bankOperationCode as 'CRED' | 'SPAY' | 'SSTD' | 'SPRI') || 'CRED',
              valueDate: m.valueDate,
              currency: m.currency,
              interbankSettledAmount: m.interbankSettledAmount,
              orderingCustomer: m.orderingCustomer || {},
              beneficiaryCustomer: m.beneficiaryCustomer || {},
              bankingDetails: m.bankingDetails,
              remittanceInformation: m.remittanceInformation,
              detailsOfCharges: (m.detailsOfCharges as 'OUR' | 'SHA' | 'BEN') || 'OUR',
              senderChargesAmount: m.senderChargesAmount,
              receiverChargesAmount: m.receiverChargesAmount,
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
      return setNested({ ...prev } as Record<string, unknown>, parts, value) as Mt103CreatePayload;
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const e20 = validateField20(form.transactionReferenceNumber || '');
    if (e20) errs.push(e20);
    if (!form.bankOperationCode) errs.push(':23B: Bank Operation Code é obrigatório');
    if (!form.valueDate) errs.push(':32A: Value Date é obrigatório');
    if (!form.currency) errs.push(':32A: Currency é obrigatório');
    if (!form.interbankSettledAmount || form.interbankSettledAmount <= 0) errs.push(':32A: Amount deve ser > 0');
    const ord = form.orderingCustomer;
    if (!ord?.orderingName?.trim() && !ord?.orderingIban?.trim() && !ord?.orderingAccountNumber?.trim()) {
      errs.push(':50: Ordering Customer (nome, IBAN ou conta) é obrigatório');
    }
    const ben = form.beneficiaryCustomer;
    if (!ben?.beneficiaryName?.trim() && !ben?.beneficiaryIban?.trim() && !ben?.beneficiaryAccountNumber?.trim()) {
      errs.push(':59: Beneficiary Customer (nome, IBAN ou conta) é obrigatório');
    }
    if (!form.detailsOfCharges) errs.push(':71A: Details of Charges (OUR/SHA/BEN) é obrigatório');
    const e70 = validateSwiftTextX(form.remittanceInformation || '', 140);
    if (e70) errs.push(`:70: ${e70}`);
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
      if (isEdit) {
        await mt103Api.update(Number(id), form);
        showSuccess('MT103 atualizada com sucesso');
        navigate(`/mt103/${id}`);
      } else {
        const r = await mt103Api.create(form);
        const msg = r.data?.data?.message;
        showSuccess('MT103 criada com sucesso');
        navigate(`/mt103/${msg?.id}`);
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
      <Button startIcon={<BackIcon />} onClick={() => navigate(isEdit ? `/mt103/${id}` : '/mt103')} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Transferência de Crédito — {isEdit ? 'Editar' : 'Nova mensagem'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        MT103 / MT103+ (REMIT) / MT103+ (STP)
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Identificação</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>MT Type</InputLabel>
            <Select
              value={form.mtType || 'MT103'}
              onChange={(e) => update('mtType', e.target.value)}
              label="MT Type"
            >
              {MT103_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Basic Message Data (Bloco 4)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            label=":20 Transaction Reference (obrigatório)"
            value={form.transactionReferenceNumber || ''}
            onChange={(e) => update('transactionReferenceNumber', e.target.value.replace(/[^a-zA-Z0-9/\-?:().,'+ ]/g, '').substring(0, 16))}
            required
          />
          <FormControl fullWidth>
            <InputLabel>:23B Bank Operation Code</InputLabel>
            <Select
              value={form.bankOperationCode || 'CRED'}
              onChange={(e) => update('bankOperationCode', e.target.value)}
              label=":23B Bank Operation Code"
            >
              {BANK_OP_CODES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="date"
            label=":32A Value Date (obrigatório)"
            value={form.valueDate || ''}
            onChange={(e) => update('valueDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControl fullWidth>
            <InputLabel>:32A Currency</InputLabel>
            <Select
              value={form.currency || 'EUR'}
              onChange={(e) => update('currency', e.target.value)}
              label=":32A Currency"
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label=":32A Interbank Settled Amount (obrigatório)"
            value={form.interbankSettledAmount || ''}
            onChange={(e) => update('interbankSettledAmount', parseFloat(e.target.value) || 0)}
            inputProps={{ min: 0, step: 0.01 }}
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
          <TextField
            fullWidth
            label=":70 Remittance Information (máx 140 chars)"
            value={form.remittanceInformation || ''}
            onChange={(e) => update('remittanceInformation', e.target.value.substring(0, 140))}
            helperText={`${(form.remittanceInformation || '').length}/140`}
          />
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
            label="Ordering IBAN"
            value={form.orderingCustomer?.orderingIban || ''}
            onChange={(e) => update('orderingCustomer.orderingIban', e.target.value.replace(/\s/g, ''))}
          />
          <TextField
            fullWidth
            label="Ordering Account Number"
            value={form.orderingCustomer?.orderingAccountNumber || ''}
            onChange={(e) => update('orderingCustomer.orderingAccountNumber', e.target.value)}
          />
          <TextField
            fullWidth
            label="Address Line 1"
            value={form.orderingCustomer?.addressLine1 || ''}
            onChange={(e) => update('orderingCustomer.addressLine1', e.target.value)}
          />
          <TextField
            fullWidth
            label="Address Line 2"
            value={form.orderingCustomer?.addressLine2 || ''}
            onChange={(e) => update('orderingCustomer.addressLine2', e.target.value)}
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
        <Typography variant="subtitle2" gutterBottom>Beneficiary Customer (:59)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Beneficiary Name"
            value={form.beneficiaryCustomer?.beneficiaryName || ''}
            onChange={(e) => update('beneficiaryCustomer.beneficiaryName', e.target.value)}
          />
          <TextField
            fullWidth
            label="Beneficiary IBAN"
            value={form.beneficiaryCustomer?.beneficiaryIban || ''}
            onChange={(e) => update('beneficiaryCustomer.beneficiaryIban', e.target.value.replace(/\s/g, ''))}
          />
          <TextField
            fullWidth
            label="Beneficiary Account Number"
            value={form.beneficiaryCustomer?.beneficiaryAccountNumber || ''}
            onChange={(e) => update('beneficiaryCustomer.beneficiaryAccountNumber', e.target.value)}
          />
          <TextField
            fullWidth
            label="Address Line 1"
            value={form.beneficiaryCustomer?.addressLine1 || ''}
            onChange={(e) => update('beneficiaryCustomer.addressLine1', e.target.value)}
          />
          <TextField
            fullWidth
            label="Address Line 2"
            value={form.beneficiaryCustomer?.addressLine2 || ''}
            onChange={(e) => update('beneficiaryCustomer.addressLine2', e.target.value)}
          />
          <TextField
            fullWidth
            label="Country"
            value={form.beneficiaryCustomer?.country || ''}
            onChange={(e) => update('beneficiaryCustomer.country', e.target.value)}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Banking Details (opcional)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            label=":52A Ordering Institution (BIC)"
            value={form.bankingDetails?.orderingInstitution || ''}
            onChange={(e) => update('bankingDetails.orderingInstitution', e.target.value.replace(/\s/g, '').toUpperCase())}
          />
          <TextField
            fullWidth
            label=":53A Sender's Correspondent (BIC)"
            value={form.bankingDetails?.sendersCorrespondent || ''}
            onChange={(e) => update('bankingDetails.sendersCorrespondent', e.target.value.replace(/\s/g, '').toUpperCase())}
          />
          <TextField
            fullWidth
            label=":54A Receiver's Correspondent (BIC)"
            value={form.bankingDetails?.receiversCorrespondent || ''}
            onChange={(e) => update('bankingDetails.receiversCorrespondent', e.target.value.replace(/\s/g, '').toUpperCase())}
          />
          <TextField
            fullWidth
            label=":56A Intermediary Institution (BIC)"
            value={form.bankingDetails?.intermediaryInstitution || ''}
            onChange={(e) => update('bankingDetails.intermediaryInstitution', e.target.value.replace(/\s/g, '').toUpperCase())}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              label=":57A Account With Institution (BIC) — Banco receptor"
              value={form.bankingDetails?.accountWithInstitution || ''}
              onChange={(e) => update('bankingDetails.accountWithInstitution', e.target.value.replace(/\s/g, '').toUpperCase())}
              sx={{ flex: 1 }}
            />
            <BankLookupButton
              bic={form.bankingDetails?.accountWithInstitution || ''}
              size="medium"
              label="Buscar Banco"
            />
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : isEdit ? 'Salvar' : 'Criar MT103'}
        </Button>
      </Box>
    </Box>
  );
};

export default Mt103FormPage;
