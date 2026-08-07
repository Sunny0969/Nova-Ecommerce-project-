import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';
import RouteFallback from '../components/RouteFallback';

const AdminLayout = lazy(() =>
  import(/* webpackChunkName: "admin-layout" */ '../pages/admin/AdminLayout')
);
const AdminDashboard = lazy(() =>
  import(/* webpackChunkName: "admin-dashboard-page" */ '../pages/admin/AdminDashboard')
);
const AdminProducts = lazy(() =>
  import(/* webpackChunkName: "admin-products-page" */ '../pages/admin/AdminProducts')
);
const ProductForm = lazy(() =>
  import(/* webpackChunkName: "admin-product-form" */ '../pages/admin/ProductForm')
);
const AdminOrders = lazy(() =>
  import(/* webpackChunkName: "admin-orders-page" */ '../pages/admin/AdminOrders')
);
const AdminOrderDetail = lazy(() =>
  import(/* webpackChunkName: "admin-order-detail-page" */ '../pages/admin/AdminOrderDetail')
);
const AdminCategories = lazy(() =>
  import(/* webpackChunkName: "admin-categories-page" */ '../pages/admin/AdminCategories')
);
const AdminShopSubcategories = lazy(() =>
  import(/* webpackChunkName: "admin-shop-subcategories" */ '../pages/admin/AdminShopSubcategories')
);
const AdminCustomers = lazy(() =>
  import(/* webpackChunkName: "admin-customers-page" */ '../pages/admin/AdminCustomers')
);
const AdminAnalytics = lazy(() =>
  import(/* webpackChunkName: "admin-analytics-page" */ '../pages/admin/AdminAnalytics')
);
const AdminStoreSettings = lazy(() =>
  import(/* webpackChunkName: "admin-store-settings-page" */ '../pages/admin/AdminStoreSettings')
);
const AdminCoupons = lazy(() =>
  import(/* webpackChunkName: "admin-coupons-page" */ '../pages/admin/AdminCoupons')
);
const AdminFraud = lazy(() =>
  import(/* webpackChunkName: "admin-fraud-page" */ '../pages/admin/AdminFraud')
);
const AdminNotifications = lazy(() =>
  import(/* webpackChunkName: "admin-notifications-page" */ '../pages/admin/AdminNotifications')
);
const AdminBlogs = lazy(() =>
  import(/* webpackChunkName: "admin-blogs-page" */ '../pages/admin/AdminBlogs')
);
const StaffManagement = lazy(() =>
  import(/* webpackChunkName: "admin-staff-page" */ '../pages/admin/StaffManagement')
);

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
          <Route path="subcategories" element={<AdminShopSubcategories />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="fraud" element={<AdminFraud />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="store-settings" element={<AdminStoreSettings />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
