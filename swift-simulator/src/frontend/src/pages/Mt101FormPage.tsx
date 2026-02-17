import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { mt101Api, type Mt101CreatePayload, type Mt101Message, type Mt101Type } from '../services/mt101Service';
import { useToast } from '../contexts/ToastContext';
import BankLookupButton from '../components/forms/BankLookupButton';
import { validateField20, validateSwiftTextX } from '../utils/swiftValidation';
import { getAccounts } from '../services/accountsService';
import type { Account } from '../services/accountsService';

const MT101_TYPES: Mt101Type[] = ['MT101', 'MT102', 'MT102STP'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'CAD', 'AUD'];
const CHARGES_TYPES = ['OUR', 'SHA', 'BEN'] as const;

const emptyTransaction = () => ({
  currency: 'EUR',
  amount: 0,
  beneficiaryName: '',
  beneficiaryIban: '',
  beneficiaryBankBic: '',
  chargesType: 'OUR' as const,
});

const Mt101FormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<Mt101CreatePayload>({
    mtType: 'MT101',
    transactionReferenceNumber: `REF${Date.now()}`.substring(0, 16),
    executionDetails: {
      requestedExecutionDate: new Date().toISOString().slice(0, 10),
    },
    transactions: [emptyTransaction()],
  });

  const isEdit = !!id;

  useEffect(() => {
    getAccounts()
      .then((r) => setAccounts(r.data?.data?.accounts ?? []))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    if (id) {
      mt101Api
        .get(Number(id))
        .then((r) => {
          const m = r.data?.data?.message as Mt101Message;
          if (m) {
            setForm({
              mtType: (m.mtType as Mt101Type) || 'MT101',
              transactionReferenceNumber: m.transactionReferenceNumber,
              customerSpecifiedReference: m.customerSpecifiedReference,
              messageIndex: m.messageIndex,
              messageTotal: m.messageTotal,
              swiftHeader: m.swiftHeader || {},
              orderingCustomer: m.orderingCustomer || {},
              executionDetails: {
                requestedExecutionDate: m.executionDetails?.requestedExecutionDate || '',
                instructionCode: m.executionDetails?.instructionCode as string,
              },
              transactions: m.transactions.map((t) => ({
                currency: t.currency,
                amount: t.amount,
                exchangeRate: t.exchangeRate,
                settlementAmount: t.settlementAmount,
                accountWithInstitution: t.beneficiaryBankBic,
                beneficiaryAccountNumber: t.beneficiaryAccountNumber,
                beneficiaryIban: t.beneficiaryIban,
                beneficiaryName: t.beneficiaryName,
                beneficiaryBankBic: t.beneficiaryBankBic,
                remittanceInformation: t.remittanceInformation,
                chargesType: (t.chargesType as 'OUR' | 'SHA' | 'BEN') || 'OUR',
                senderChargesAmount: t.senderChargesAmount,
                receiverChargesAmount: t.receiverChargesAmount,
              })),
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
      return setNested({ ...prev } as Record<string, unknown>, parts, value) as Mt101CreatePayload;
    });
  };

  const updateTx = (idx: number, key: string, value: unknown) => {
    setForm((prev) => {
      const txs = [...(prev.transactions || [])];
      txs[idx] = { ...txs[idx], [key]: value };
      return { ...prev, transactions: txs };
    });
  };

  const addTransaction = () => {
    setForm((prev) => ({
      ...prev,
      transactions: [...(prev.transactions || []), emptyTransaction()],
    }));
  };

  const removeTransaction = (idx: number) => {
    setForm((prev) => {
      const txs = prev.transactions?.filter((_, i) => i !== idx) || [];
      return { ...prev, transactions: txs.length ? txs : [emptyTransaction()] };
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const e20 = validateField20(form.transactionReferenceNumber || '');
    if (e20) errs.push(e20);
    if (!form.executionDetails?.requestedExecutionDate) errs.push(':30: Execution Date é obrigatório');
    const execDate = new Date(form.executionDetails!.requestedExecutionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    execDate.setHours(0, 0, 0, 0);
    if (execDate < today) errs.push(':30: Execution Date deve ser >= hoje');
    if (!form.transactions?.length) errs.push('Pelo menos uma transação é obrigatória');
    form.transactions?.forEach((t, i) => {
      if (!t.currency) errs.push(`Tx ${i + 1}: Currency obrigatório`);
      if (!t.amount || t.amount <= 0) errs.push(`Tx ${i + 1}: Amount > 0`);
      if (!t.beneficiaryName?.trim() && !t.beneficiaryIban?.trim()) errs.push(`Tx ${i + 1}: Beneficiary (nome ou IBAN) obrigatório`);
      if (!t.chargesType) errs.push(`Tx ${i + 1}: Charges (OUR/SHA/BEN) obrigatório`);
      const e70 = validateSwiftTextX(t.remittanceInformation || '', 140);
      if (e70) errs.push(`Tx ${i + 1}: :70: ${e70}`);
    });
    if (form.transactions && form.transactions.length > 1 && (!form.messageIndex || !form.messageTotal)) {
      errs.push(':28D: Message Index/Total obrigatório com múltiplas transações');
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
      if (isEdit) {
        await mt101Api.update(Number(id), form);
        showSuccess('MT101 atualizada com sucesso');
        navigate(`/mt101/${id}`);
      } else {
        const r = await mt101Api.create(form);
        const msg = r.data?.data?.message;
        showSuccess('MT101 criada com sucesso');
        navigate(`/mt101/${msg?.id}`);
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
      <Button startIcon={<BackIcon />} onClick={() => navigate(isEdit ? `/mt101/${id}` : '/mt101')} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Transferência Múltipla — {isEdit ? 'Editar' : 'Nova mensagem'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        MT101 / MT102 / MT102+ (STP)
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Identificação</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>MT Type</InputLabel>
            <Select
              value={form.mtType || 'MT101'}
              onChange={(e) => update('mtType', e.target.value)}
              label="MT Type"
            >
              {MT101_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Basic Data</Typography>
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
            label=":21R Customer Reference"
            value={form.customerSpecifiedReference || ''}
            onChange={(e) => update('customerSpecifiedReference', e.target.value.substring(0, 16))}
          />
          <TextField
            fullWidth
            type="date"
            label=":30 Requested Execution Date (obrigatório)"
            value={form.executionDetails?.requestedExecutionDate || ''}
            onChange={(e) => update('executionDetails.requestedExecutionDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label=":23E Instruction Code"
            value={form.executionDetails?.instructionCode || ''}
            onChange={(e) => update('executionDetails.instructionCode', e.target.value)}
          />
          {form.transactions && form.transactions.length > 1 && (
            <>
              <TextField
                fullWidth
                type="number"
                label=":28D Message Index"
                value={form.messageIndex ?? ''}
                onChange={(e) => update('messageIndex', e.target.value ? Number(e.target.value) : undefined)}
              />
              <TextField
                fullWidth
                type="number"
                label=":28D Message Total"
                value={form.messageTotal ?? ''}
                onChange={(e) => update('messageTotal', e.target.value ? Number(e.target.value) : undefined)}
              />
            </>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Ordering Customer (Debtor)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Ordering Customer Name"
            value={form.orderingCustomer?.orderingCustomerName || ''}
            onChange={(e) => update('orderingCustomer.orderingCustomerName', e.target.value)}
          />
          <TextField
            fullWidth
            label="Ordering IBAN"
            value={form.orderingCustomer?.orderingIban || ''}
            onChange={(e) => update('orderingCustomer.orderingIban', e.target.value.replace(/\s/g, ''))}
          />
          <TextField
            fullWidth
            label="Account Number"
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
            label="City"
            value={form.orderingCustomer?.city || ''}
            onChange={(e) => update('orderingCustomer.city', e.target.value)}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">Transactions (repetível)</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addTransaction}>
            Adicionar
          </Button>
        </Box>
        {form.transactions?.map((tx, idx) => (
          <Box key={idx} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption">Transação {idx + 1}</Typography>
              {form.transactions!.length > 1 && (
                <IconButton size="small" onClick={() => removeTransaction(idx)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={tx.currency || 'EUR'}
                  onChange={(e) => updateTx(idx, 'currency', e.target.value)}
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
                value={tx.amount || ''}
                onChange={(e) => updateTx(idx, 'amount', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
              <FormControl fullWidth size="small">
                <InputLabel>:71A Charges (obrigatório)</InputLabel>
                <Select
                  value={tx.chargesType || 'OUR'}
                  onChange={(e) => updateTx(idx, 'chargesType', e.target.value)}
                  label=":71A Charges (obrigatório)"
                >
                  {CHARGES_TYPES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                label=":59 Beneficiary Name"
                value={tx.beneficiaryName || ''}
                onChange={(e) => updateTx(idx, 'beneficiaryName', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label=":59 Beneficiary IBAN"
                value={tx.beneficiaryIban || ''}
                onChange={(e) => updateTx(idx, 'beneficiaryIban', e.target.value.replace(/\s/g, ''))}
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Beneficiary Bank BIC — Banco receptor"
                  value={tx.beneficiaryBankBic || ''}
                  onChange={(e) => updateTx(idx, 'beneficiaryBankBic', e.target.value.replace(/\s/g, ''))}
                  sx={{ flex: 1 }}
                />
                <BankLookupButton
                  bic={tx.beneficiaryBankBic || ''}
                  size="small"
                  label="Buscar Banco"
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label=":70 Remittance (máx 140 chars)"
                value={tx.remittanceInformation || ''}
                onChange={(e) => updateTx(idx, 'remittanceInformation', e.target.value.substring(0, 140))}
                helperText={`${(tx.remittanceInformation || '').length}/140`}
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
          {submitting ? <CircularProgress size={24} /> : isEdit ? 'Salvar' : 'Criar MT101'}
        </Button>
      </Box>
    </Box>
  );
};

export default Mt101FormPage;
