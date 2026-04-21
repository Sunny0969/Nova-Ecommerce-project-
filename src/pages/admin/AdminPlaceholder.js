import React from 'react';

export default function AdminPlaceholder({ title, description }) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{title}</h2>
      <p style={{ color: 'var(--gray)', maxWidth: 520 }}>
        {description ||
          'Connect this screen to your admin API routes (see `adminAPI` in `src/api/axios.js`).'}
      </p>
    </div>
  );
}
