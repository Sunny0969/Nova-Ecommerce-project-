import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StaffRoute from '../components/StaffRoute';
import RouteFallback from '../components/RouteFallback';

const StaffLayout = lazy(() => import('../pages/staff/StaffLayout'));
const StaffDashboard = lazy(() => import('../pages/staff/StaffDashboard'));
const StaffProducts = lazy(() => import('../pages/staff/StaffProducts'));
const StaffCategories = lazy(() => import('../pages/staff/StaffCategories'));
const StaffOrders = lazy(() => import('../pages/staff/StaffOrders'));
const ProductForm = lazy(() => import('../pages/admin/ProductForm'));
const AdminOrderDetail = lazy(() => import('../pages/admin/AdminOrderDetail'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons'));
const AdminPlaceholder = lazy(() => import('../pages/admin/AdminPlaceholder'));

/** Staff portal — loaded only when visiting /staff/* */
export default function StaffRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffLayout />
            </StaffRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <StaffRoute permission="viewAnalytics">
                <StaffDashboard />
              </StaffRoute>
            }
          />
          <Route
            path="products"
            element={
              <StaffRoute permission="manageProducts">
                <StaffProducts />
              </StaffRoute>
            }
          />
          <Route
            path="products/new"
            element={
              <StaffRoute permission="manageProducts">
                <ProductForm />
              </StaffRoute>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <StaffRoute permission="manageProducts">
                <ProductForm />
              </StaffRoute>
            }
          />
          <Route
            path="categories"
            element={
              <StaffRoute permission="manageCategories">
                <StaffCategories />
              </StaffRoute>
            }
          />
          <Route
            path="orders"
            element={
              <StaffRoute permission="manageOrders">
                <StaffOrders />
              </StaffRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <StaffRoute permission="manageOrders">
                <AdminOrderDetail basePath="/staff" />
              </StaffRoute>
            }
          />
          <Route
            path="customers"
            element={
              <StaffRoute permission="manageCustomers">
                <AdminCustomers />
              </StaffRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <StaffRoute permission="viewAnalytics">
                <AdminAnalytics />
              </StaffRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <StaffRoute permission="manageCoupons">
                <AdminCoupons />
              </StaffRoute>
            }
          />
          <Route
            path="blog"
            element={
              <StaffRoute permission="manageBlog">
                <AdminPlaceholder
                  title="Blog management"
                  description="Connect your staff blog management screen here."
                />
              </StaffRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
