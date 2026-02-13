import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setLoading(false);
    } else {
      getProfile()
        .then((r) => {
          const payload = r.data?.data ?? r.data;
          const u = payload?.user;
          if (u) {
            setName(u.name);
            setEmail(u.email);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, email });
      showSuccess('Perfil atualizado com sucesso');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Perfil
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 480 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Salvar alterações'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
