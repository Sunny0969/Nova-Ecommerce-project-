import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import api from 'api';

export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => email.trim() && password, [email, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/api/staff/login', {
        email: email.trim(),
        password
      });
      const token = res.data?.token;
      const staff = res.data?.staff;
      if (!token || !staff) {
        setError('Login failed. Please try again.');
        return;
      }
      localStorage.setItem('staffToken', String(token));
      localStorage.setItem('staffPermissions', JSON.stringify(staff.permissions || {}));
      localStorage.setItem('staffUser', JSON.stringify(staff));
      toast.success('Welcome — staff access granted');
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed';
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO noIndex title="Staff Access Login" description="Staff access login for Nova Shop." />
      <main className="auth-page" id="main-content">
        <div className="auth-page__shell">
          <div className="auth-page__panel" style={{ maxWidth: 520 }}>
            <div className="auth-page__brand" style={{ marginBottom: 18 }}>
              <span className="auth-page__logo" aria-hidden>
                Nova
              </span>
              <span className="auth-page__logo-dot" aria-hidden>
                .
              </span>
            </div>

            <h1 style={{ margin: '0 0 6px' }}>Staff Access Login</h1>
            <p className="text-muted" style={{ marginTop: 0 }}>
              Enter your credentials provided by admin
            </p>

            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label className="auth-field">
                <span className="auth-field__label">Email</span>
                <input
                  className="auth-field__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="auth-field">
                <span className="auth-field__label">Password</span>
                <input
                  className="auth-field__input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <div className="api-error-banner" role="alert" style={{ marginTop: 6 }}>
                  {error}
                </div>
              ) : null}

              <button type="submit" className="btn btn-primary" disabled={!canSubmit || busy}>
                {busy ? 'Logging in…' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

