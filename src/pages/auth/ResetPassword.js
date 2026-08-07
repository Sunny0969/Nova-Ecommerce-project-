import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import PasswordInput from '../../components/PasswordInput';
import { authAPI } from '../../api/auth';
import { apiMessage } from '../../lib/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authAPI.resetPassword({ token, password });
      setDone(true);
      toast.success(res.data?.message || 'Password updated successfully');
      window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not reset password. The link may have expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page section container" style={{ maxWidth: 480, margin: '0 auto' }}>
        <SEO noIndex title="Invalid reset link" canonicalUrl="/reset-password" />
        <div className="auth-card">
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Invalid reset link</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1rem' }}>
            This password reset link is missing or invalid. Request a new one from the sign-in page.
          </p>
          <Link to="/forgot-password" className="btn btn-primary btn-full" style={{ display: 'inline-block', textAlign: 'center' }}>
            Request new link
          </Link>
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
            <Link to="/login">← Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page section container" style={{ maxWidth: 480, margin: '0 auto' }}>
      <SEO
        noIndex
        title="Set new password"
        description="Set a new password for your Bazaar account using the secure link from your email."
        canonicalUrl="/reset-password"
      />
      <div className="auth-card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Choose a new password</h1>
        {done ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Your password has been updated. Redirecting you to sign in…
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Enter a new password for your Bazaar account. Use at least 6 characters.
          </p>
        )}

        {!done ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="rp-password">
                New password
              </label>
              <PasswordInput
                id="rp-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={submitting}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="rp-confirm">
                Confirm password
              </label>
              <PasswordInput
                id="rp-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={submitting}
                placeholder="Repeat new password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        ) : (
          <Link to="/login" className="btn btn-primary btn-full" style={{ display: 'inline-block', textAlign: 'center' }}>
            Sign in now
          </Link>
        )}

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
