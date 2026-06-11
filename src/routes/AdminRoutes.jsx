import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';
import RouteFallback from '../components/RouteFallback';

const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const ProductForm = lazy(() => import('../pages/admin/ProductForm'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('../pages/admin/AdminOrderDetail'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminStoreSettings = lazy(() => import('../pages/admin/AdminStoreSettings'));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons'));
const AdminFraud = lazy(() => import('../pages/admin/AdminFraud'));
const StaffManagement = lazy(() => import('../pages/admin/StaffManagement'));

/** Admin panel — loaded only when visiting /admin/* */
export default function AdminRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="fraud" element={<AdminFraud />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="store-settings" element={<AdminStoreSettings />} />
          <Route path="staff" element={<StaffManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
