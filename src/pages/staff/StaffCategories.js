import React from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import AdminCategories from '../admin/AdminCategories';

export default function StaffCategories() {
  const { hasPermission } = useStaffAuth();
  if (!hasPermission('manageCategories')) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="api-error-banner" role="alert">
          You don’t have permission to manage categories.
        </div>
      </div>
    );
  }
  // Reuse the existing admin UI (API is permission-gated on the backend).
  return <AdminCategories />;
}

