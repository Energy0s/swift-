import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { searchBanks, type Bank } from '../../services/banksService';

interface BicFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  disabled?: boolean;
  bankInfo?: { name?: string; city?: string; country?: string } | null;
}

const BicField: React.FC<BicFieldProps> = ({
  value,
  onChange,
  onBlur,
  error,
  helperText,
  label = 'BIC/SWIFT',
  disabled,
  bankInfo,
}) => {
  const [suggestions, setSuggestions] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchBanks(value, 15);
        setSuggestions(res.data?.data?.banks ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = (bank: Bank) => {
    onChange(bank.bic);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onBlur={() => {
          setTimeout(() => setOpen(false), 200);
          onBlur?.();
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        error={error}
        helperText={helperText}
        disabled={disabled}
        placeholder="Ex: COBADEFFXXX"
        InputProps={{
          endAdornment: loading ? <CircularProgress size={20} sx={{ ml: 1 }} /> : null,
        }}
      />
      {bankInfo?.name && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {bankInfo.name}
          {bankInfo.city && ` — ${bankInfo.city}`}
          {bankInfo.country && `, ${bankInfo.country}`}
        </Typography>
      )}
      {open && suggestions.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            maxHeight: 240,
            overflow: 'auto',
          }}
        >
          <List dense>
            {suggestions.map((bank) => (
              <ListItemButton key={bank.bic} onClick={() => handleSelect(bank)}>
                <ListItemText
                  primary={bank.bic}
                  secondary={`${bank.name} — ${bank.city}, ${bank.country}`}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default BicField;
