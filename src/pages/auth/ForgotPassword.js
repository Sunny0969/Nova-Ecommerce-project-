import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import { authAPI } from '../../api/auth';
import { apiMessage } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email address');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authAPI.forgotPassword({ email: trimmed });
      const msg =
        res.data?.message ||
        'If an account exists for that email, we sent a password reset link.';
      setSent(true);
      toast.success(msg);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not send reset link. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page section container" style={{ maxWidth: 480, margin: '0 auto' }}>
      <SEO
        noIndex
        title="Reset password"
        description="Request a password reset link for your Bazaar account. Secure and private — not for search indexing."
        canonicalUrl="/forgot-password"
      />
      <div className="auth-card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset your password</h1>
        {sent ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Check your inbox for a link from <strong>Bazaar</strong>. It expires in 15 minutes. If you do not see
            it, check your spam folder or try again with the correct email.
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Enter the email you used to register. We will send you a secure link to choose a new password.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fp-email">
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={submitting}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Sending…' : sent ? 'Resend reset link' : 'Send reset link'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
