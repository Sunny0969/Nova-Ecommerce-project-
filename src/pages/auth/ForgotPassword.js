import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  return (
    <main className="auth-page section container" id="main-content" style={{ maxWidth: 480, margin: '0 auto' }}>
      <SEO
        noIndex
        title="Reset password"
        description="Request a password reset link for your Nova Shop account. Secure and private — not for search indexing."
        canonicalUrl="/forgot-password"
      />
      <div className="auth-card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset your password</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Enter your email address. When the reset API is connected, you&apos;ll receive a link to choose a new
          password.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
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
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled>
            Send reset link
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
