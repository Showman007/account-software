import { Alert, Box, Button, Card, CardContent, Divider, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';

import { useAuth } from '../../context/AuthContext.tsx';
import { APP_CONFIG } from '../../config/appConfig.ts';
import { useState } from 'react';

const LoginPageComp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError('Google sign-in failed: No credential received');
      setGoogleFailed(true);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await googleLogin(response.credential);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Google sign-in failed. Please try again.');
      setGoogleFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
    setGoogleFailed(true);
  };

  const handleRetryGoogle = () => {
    setError('');
    setGoogleFailed(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Card sx={{ width: { xs: '100%', sm: 400 }, mx: { xs: 2, sm: 0 } }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" fontWeight="bold" color="primary" gutterBottom>
            {APP_CONFIG.name}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Google SSO Button — hide after failure to prevent auto-retry loop */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {googleFailed ? (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleRetryGoogle}
                sx={{ py: 1.2 }}
              >
                Try Google Sign-In Again
              </Button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="350"
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
                auto_select={false}
                cancel_on_tap_outside
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginPageComp;
