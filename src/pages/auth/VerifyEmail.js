import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function VerifyEmail() {
  const { token } = useParams();

  return (
    <main className="section container text-center" id="main-content" style={{ padding: '4rem 1rem' }}>
      <SEO
        noIndex
        title="Verify email"
        description="Complete email verification for your Nova Shop account. This link is personal and is not shown in public search results."
        canonicalUrl={token ? `/verify-email/${token}` : '/verify-email'}
      />
      <h1 style={{ marginBottom: '1rem' }}>Verify your email</h1>
      <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>
        Token (preview): <code style={{ fontSize: '0.8rem' }}>{token?.slice(0, 16)}…</code>
      </p>
      <p style={{ color: 'var(--gray)', marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
        Connect this route to your verification API. Until then, you can use your account if registration already
        marked the email as verified.
      </p>
      <Link to="/login" className="btn btn-primary">
        Sign in
      </Link>
    </main>
  );
}
