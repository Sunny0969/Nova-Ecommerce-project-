import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppToaster } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import RouteFallback from './components/RouteFallback';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { StaffAuthProvider } from './context/StaffAuthContext';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const LegacyShopRedirect = lazy(() => import('./pages/LegacyShopRedirect'));
const LegacyProductRedirect = lazy(() => import('./pages/LegacyProductRedirect'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountDashboard = lazy(() => import('./pages/account/AccountDashboard'));
const MyOrders = lazy(() => import('./pages/account/MyOrders'));
const OrderDetail = lazy(() => import('./pages/account/OrderDetail'));
const Profile = lazy(() => import('./pages/account/Profile'));
const Addresses = lazy(() => import('./pages/account/Addresses'));
const AccountWishlist = lazy(() => import('./pages/account/Wishlist'));
const MyReviews = lazy(() => import('./pages/account/MyReviews'));
const Orders = lazy(() => import('./pages/Orders'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const Blog = lazy(() => import('./pages/Blog'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminPlaceholder = lazy(() => import('./pages/admin/AdminPlaceholder'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminStoreSettings = lazy(() => import('./pages/admin/AdminStoreSettings'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminFraud = lazy(() => import('./pages/admin/AdminFraud'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const StaffLayout = lazy(() => import('./pages/staff/StaffLayout'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StaffProducts = lazy(() => import('./pages/staff/StaffProducts'));
const StaffCategories = lazy(() => import('./pages/staff/StaffCategories'));
const StaffOrders = lazy(() => import('./pages/staff/StaffOrders'));
const Navbar = lazy(() => import('./components/Navbar'));
const Footer = lazy(() => import('./components/Footer'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isStaff = location.pathname.startsWith('/staff');
  return (
    <div className="App">
      <AppToaster />
      {!isAdmin && !isStaff && (
        <Suspense fallback={<header className="site-chrome-placeholder site-chrome-placeholder--header" aria-hidden />}>
          <Navbar />
        </Suspense>
      )}
      {!isAdmin && !isStaff && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
      <main className={isAdmin || isStaff ? 'main-content main-content--admin' : 'main-content'}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/shop/:slug" element={<ProductDetail />} />
                      <Route path="/category/:slug" element={<CategoryPage />} />

                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/admin-login"
                        element={<Navigate to={{ pathname: '/login', search: '?next=/admin' }} replace />}
                      />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                      <Route path="/verify-email/:token" element={<VerifyEmail />} />

                      <Route path="/products" element={<LegacyShopRedirect />} />
                      <Route path="/product/:slug" element={<LegacyProductRedirect />} />

                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute>
                            <Cart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/order-confirmation/:id"
                        element={
                          <ProtectedRoute>
                            <OrderConfirmation />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/account"
                        element={
                          <ProtectedRoute>
                            <AccountLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<AccountDashboard />} />
                        <Route path="orders" element={<MyOrders />} />
                        <Route path="orders/:id" element={<OrderDetail />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="addresses" element={<Addresses />} />
                        <Route path="wishlist" element={<AccountWishlist />} />
                        <Route path="reviews" element={<MyReviews />} />
                      </Route>

                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/blog" element={<Blog />} />

                      <Route path="/staff-login" element={<StaffLogin />} />
                      <Route path="/staff" element={<StaffLayout />}>
                        <Route path="dashboard" element={<StaffDashboard />} />
                        <Route path="products" element={<StaffProducts />} />
                        <Route path="categories" element={<StaffCategories />} />
                        <Route path="orders" element={<StaffOrders />} />
                      </Route>

                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="products/new" element={<ProductForm />} />
                        <Route path="products/:id/edit" element={<ProductForm />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route
                          path="orders/:id"
                          element={<AdminPlaceholder title="Order detail" />}
                        />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="customers" element={<AdminCustomers />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                        <Route path="fraud" element={<AdminFraud />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="store-settings" element={<AdminStoreSettings />} />
                      <Route path="staff" element={<StaffManagement />} />
                      </Route>

            {/* Catch-all: unknown storefront paths → custom 404 (noIndex in NotFound) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && (
        <Suspense fallback={<footer className="site-chrome-placeholder site-chrome-placeholder--footer" aria-hidden />}>
          <Footer />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
              <StaffAuthProvider>
                <AppShell />
              </StaffAuthProvider>
            </Router>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
