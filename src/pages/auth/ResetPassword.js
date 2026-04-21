import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function ResetPassword() {
  const { token } = useParams();

  return (
    <main className="auth-page section container" id="main-content" style={{ maxWidth: 480, margin: '0 auto' }}>
      <SEO
        noIndex
        title="Set new password"
        description="Set a new password for your Nova Shop account using the secure link from your email. One-time, private page."
        canonicalUrl={token ? `/reset-password/${token}` : '/reset-password'}
      />
      <div className="auth-card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Set a new password</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1rem' }}>
          Token received (preview): <code style={{ fontSize: '0.75rem' }}>{token?.slice(0, 12)}…</code>
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>
          Wire this page to <code>POST /api/auth/reset-password</code> when your backend endpoint is ready.
        </p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
