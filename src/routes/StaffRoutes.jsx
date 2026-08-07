import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StaffRoute from '../components/StaffRoute';
import RouteFallback from '../components/RouteFallback';

const StaffLayout = lazy(() =>
  import(/* webpackChunkName: "staff-layout" */ '../pages/staff/StaffLayout')
);
const StaffDashboard = lazy(() =>
  import(/* webpackChunkName: "staff-dashboard-page" */ '../pages/staff/StaffDashboard')
);
const StaffProducts = lazy(() =>
  import(/* webpackChunkName: "staff-products-page" */ '../pages/staff/StaffProducts')
);
const StaffCategories = lazy(() =>
  import(/* webpackChunkName: "staff-categories-page" */ '../pages/staff/StaffCategories')
);
const StaffOrders = lazy(() =>
  import(/* webpackChunkName: "staff-orders-page" */ '../pages/staff/StaffOrders')
);
const ProductForm = lazy(() =>
  import(/* webpackChunkName: "admin-product-form" */ '../pages/admin/ProductForm')
);
const AdminOrderDetail = lazy(() =>
  import(/* webpackChunkName: "admin-order-detail-page" */ '../pages/admin/AdminOrderDetail')
);
const AdminCustomers = lazy(() =>
  import(/* webpackChunkName: "admin-customers-page" */ '../pages/admin/AdminCustomers')
);
const AdminAnalytics = lazy(() =>
  import(/* webpackChunkName: "admin-analytics-page" */ '../pages/admin/AdminAnalytics')
);
const AdminCoupons = lazy(() =>
  import(/* webpackChunkName: "admin-coupons-page" */ '../pages/admin/AdminCoupons')
);
const AdminPlaceholder = lazy(() =>
  import(/* webpackChunkName: "admin-placeholder-page" */ '../pages/admin/AdminPlaceholder')
);

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
          <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
