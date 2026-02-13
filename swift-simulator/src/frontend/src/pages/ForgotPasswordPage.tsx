import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // TODO: POST /api/auth/forgot-password com { email }
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
    } catch {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={0} sx={{ padding: 4, width: '100%', border: '1px solid #E0E0E0' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Recuperar senha
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            Informe seu email para receber o link de recuperação
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {sent ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Se o email existir, você receberá um link para redefinir a senha.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </Button>
            </Box>
          )}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Voltar ao login
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
