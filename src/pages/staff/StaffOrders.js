import React from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import AdminOrders from '../admin/AdminOrders';

export default function StaffOrders() {
  const { hasPermission } = useStaffAuth();
  if (!hasPermission('manageOrders')) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="api-error-banner" role="alert">
          You don’t have permission to manage orders.
        </div>
      </div>
    );
  }
  // Reuse admin orders UI; backend disallows destructive actions already.
  return <AdminOrders />;
}

