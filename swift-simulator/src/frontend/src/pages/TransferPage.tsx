import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAccounts } from '../services/accountsService';
import { validateIban, validateBic } from '../services/validateService';
import { createTransfer } from '../services/transfersService';
import type { Account } from '../services/accountsService';
import BicField from '../components/forms/BicField';
import TransferProgressModal from '../components/ui/TransferProgressModal';
import { useToast } from '../contexts/ToastContext';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'BRL', 'JPY'];
const FEE = 25;
const CATEGORIA_SEPA = [
  { value: 'OTHR', label: 'Outro' },
  { value: 'SALA', label: 'Salário' },
  { value: 'CORT', label: 'Bens/Serviços' },
  { value: 'SUPP', label: 'Fornecedor' },
  { value: 'GOVT', label: 'Governo' },
];

const BANK_OPERATION_CODE = [
  { value: 'CRED', label: 'CRED — Crédito normal' },
  { value: 'SPAY', label: 'SPAY — SWIFT Pay' },
  { value: 'SSTD', label: 'SSTD — SWIFT Standard' },
  { value: 'SPRI', label: 'SPRI — SWIFT Priority' },
];

const DETAILS_OF_CHARGES = [
  { value: 'OUR', label: 'OUR — Taxas pagas pelo ordenante' },
  { value: 'BEN', label: 'BEN — Taxas pagas pelo beneficiário' },
  { value: 'SHA', label: 'SHA — Taxas compartilhadas' },
];

const formatIban = (v: string) => {
  const c = v.replace(/\s/g, '').toUpperCase();
  return c.replace(/(.{4})/g, '$1 ').trim();
};

const TransferPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<number | ''>('');
  const [destinationIban, setDestinationIban] = useState('');
  const [destinationBic, setDestinationBic] = useState('');
  const [destinationHolderName, setDestinationHolderName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [purpose, setPurpose] = useState('');
  const [categoryPurpose, setCategoryPurpose] = useState('OTHR');
  const [bankOperationCode, setBankOperationCode] = useState<'CRED' | 'SPAY' | 'SSTD' | 'SPRI'>('CRED');
  const [detailsOfCharges, setDetailsOfCharges] = useState<'OUR' | 'BEN' | 'SHA'>('OUR');
  const [ibanValid, setIbanValid] = useState<boolean | null>(null);
  const [bicValid, setBicValid] = useState<boolean | null>(null);
  const [bankInfo, setBankInfo] = useState<{ name?: string; city?: string; country?: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedAccount = accounts.find((a) => a.id === sourceAccountId);
  const numAmount = parseFloat(amount) || 0;
  const total = numAmount + FEE;
  const dailyUsed = selectedAccount?.dailyUsed ?? 0;
  const dailyRemaining = selectedAccount ? selectedAccount.dailyLimit - dailyUsed : 0;
  const exceedsDailyLimit = selectedAccount && total > dailyRemaining;
  const canSubmit =
    sourceAccountId &&
    destinationIban &&
    destinationBic &&
    destinationHolderName &&
    numAmount > 0 &&
    selectedAccount &&
    selectedAccount.balance >= total &&
    !exceedsDailyLimit &&
    ibanValid === true &&
    bicValid === true;

  useEffect(() => {
    getAccounts()
      .then((r) => setAccounts(r.data?.data?.accounts ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleIbanBlur = async () => {
    const clean = destinationIban.replace(/\s/g, '');
    if (clean.length < 15) {
      setIbanValid(null);
      return;
    }
    try {
      const res = await validateIban(clean);
      setIbanValid(res.data?.data?.valid ?? false);
    } catch {
      setIbanValid(false);
    }
  };

  const handleBicBlur = async () => {
    const clean = destinationBic.replace(/\s/g, '');
    if (clean.length < 8) {
      setBicValid(null);
      setBankInfo(null);
      return;
    }
    try {
      const res = await validateBic(clean);
      const d = res.data?.data;
      setBicValid(d?.valid ?? false);
      setBankInfo(
        d?.valid && (d?.bankName || d?.city || d?.country)
          ? { name: d.bankName ?? undefined, city: d.city ?? undefined, country: d.country ?? undefined }
          : null
      );
    } catch {
      setBicValid(false);
      setBankInfo(null);
    }
  };

  const handleSubmitTransfer = async () => {
    const res = await createTransfer({
      sourceAccountId: Number(sourceAccountId),
      destinationIban: destinationIban.replace(/\s/g, ''),
      destinationBic: destinationBic.replace(/\s/g, ''),
      destinationHolderName,
      amount: numAmount,
      currency,
      purpose: purpose || undefined,
      categoryPurpose,
      bankOperationCode,
      detailsOfCharges,
    });
    const ref = res.data?.data?.transfer?.referenceNumber ?? '';
    const transferId = res.data?.data?.transfer?.id ?? 0;
    return { transferId, ref };
  };

  const handleSuccess = (transferId: number, ref: string) => {
    setModalOpen(false);
    showSuccess(
      'Transferência criada com sucesso',
      ref,
      () => navigate(`/transactions/${transferId}`),
      'Ver detalhes'
    );
    navigate(`/transactions/${transferId}`);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton width={280} height={40} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
          </Box>
          <Skeleton variant="rectangular" width={280} height={140} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Nova transferência SWIFT
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Transferências &gt; Nova
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Debitar de</InputLabel>
              <Select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value as number | '')}
                label="Debitar de"
              >
                {accounts.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.accountNumber} — {a.balance.toFixed(2)} {a.currency}
                  </MenuItem>
                ))}
              </Select>
              {selectedAccount && (
                <FormHelperText>
                  Saldo disponível: {selectedAccount.balance.toFixed(2)} {selectedAccount.currency}
                  {' · '}
                  Limite diário: {(selectedAccount.dailyUsed ?? 0).toFixed(2)} / {selectedAccount.dailyLimit.toFixed(2)} {selectedAccount.currency} usados hoje
                </FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="IBAN"
              value={destinationIban}
              onChange={(e) => setDestinationIban(formatIban(e.target.value))}
              onBlur={handleIbanBlur}
              error={ibanValid === false}
              helperText={
                ibanValid === true ? 'IBAN válido' : ibanValid === false ? 'IBAN inválido' : 'Formato: XX00 0000 0000 0000 0000 00'
              }
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <BicField
                value={destinationBic}
                onChange={setDestinationBic}
                onBlur={handleBicBlur}
                error={bicValid === false}
                helperText={bicValid === true ? 'BIC válido' : bicValid === false ? 'BIC inválido' : undefined}
                bankInfo={bankInfo}
              />
            </Box>

            <TextField
              fullWidth
              label="Nome do beneficiário"
              value={destinationHolderName}
              onChange={(e) => setDestinationHolderName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Moeda"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              select
              label="23B — Bank Operation Code"
              value={bankOperationCode}
              onChange={(e) => setBankOperationCode(e.target.value as 'CRED' | 'SPAY' | 'SSTD' | 'SPRI')}
              helperText="Código de operação bancária SWIFT"
              sx={{ mt: 2 }}
            >
              {BANK_OPERATION_CODE.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="71A — Details of Charges"
              value={detailsOfCharges}
              onChange={(e) => setDetailsOfCharges(e.target.value as 'OUR' | 'BEN' | 'SHA')}
              helperText="Quem paga as taxas da transferência"
              sx={{ mt: 2 }}
            >
              {DETAILS_OF_CHARGES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="70 — Propósito / Remittance Info (opcional)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Categoria SEPA (opcional)"
              value={categoryPurpose}
              onChange={(e) => setCategoryPurpose(e.target.value)}
              sx={{ mt: 2 }}
            >
              {CATEGORIA_SEPA.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={async () => {
                  await handleIbanBlur();
                  await handleBicBlur();
                }}
              >
                Validar IBAN e BIC
              </Button>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                disabled={!canSubmit}
                onClick={() => setModalOpen(true)}
              >
                Confirmar transferência
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Resumo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Você envia: {numAmount > 0 ? `${numAmount.toFixed(2)} ${currency}` : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Taxa: {FEE.toFixed(2)} {currency}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              Total: {total > 0 ? `${total.toFixed(2)} ${currency}` : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Beneficiário recebe: {numAmount > 0 ? `${numAmount.toFixed(2)} ${currency}` : '—'}
            </Typography>
            {selectedAccount && total > selectedAccount.balance && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                AM04 - Saldo insuficiente
              </Typography>
            )}
            {exceedsDailyLimit && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                DM01 - Limite diário excedido. Usado hoje: {dailyUsed.toFixed(2)}. Limite: {selectedAccount?.dailyLimit.toFixed(2)} {selectedAccount?.currency}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <TransferProgressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        onError={(msg) => {
          setModalOpen(false);
          showError(msg, () => setModalOpen(true));
        }}
        onSubmit={handleSubmitTransfer}
      >
        <Typography variant="body2">
          De: {selectedAccount?.accountNumber} ({selectedAccount?.currency})
        </Typography>
        <Typography variant="body2">
          Para: {destinationHolderName} — {destinationIban}
        </Typography>
        <Typography variant="body2">
          Valor: {numAmount.toFixed(2)} {currency} + taxa {FEE} {currency} = {total.toFixed(2)} {currency}
        </Typography>
        {purpose && (
          <Typography variant="body2" color="text.secondary">
            Propósito: {purpose}
          </Typography>
        )}
      </TransferProgressModal>
    </Box>
  );
};

export default TransferPage;
