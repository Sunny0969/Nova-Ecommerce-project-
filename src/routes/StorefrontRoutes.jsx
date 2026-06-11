import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { PageSuspenseFallback } from '../components/RouteFallback';

const Home = lazy(() => import('../pages/Home'));
const Shop = lazy(() => import('../pages/Products'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const BrandsPage = lazy(() => import('../pages/BrandsPage'));
const LegacyShopRedirect = lazy(() => import('../pages/LegacyShopRedirect'));
const LegacyProductRedirect = lazy(() => import('../pages/LegacyProductRedirect'));
const CatalogCategoryRoute = lazy(() =>
  import('../pages/CatalogRoutes').then((m) => ({ default: m.CatalogCategoryRoute }))
);
const CatalogProductRoute = lazy(() =>
  import('../pages/CatalogRoutes').then((m) => ({ default: m.CatalogProductRoute }))
);
const LegacyCatalogProductRedirect = lazy(() =>
  import('../pages/CatalogRoutes').then((m) => ({ default: m.LegacyCatalogProductRedirect }))
);
const LegacyCatalogCategoryRedirect = lazy(() =>
  import('../pages/CatalogRoutes').then((m) => ({ default: m.LegacyCatalogCategoryRedirect }))
);
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'));
const Cart = lazy(() => import('../pages/Cart'));
const Checkout = lazy(() => import('../pages/Checkout'));
const OrderConfirmation = lazy(() => import('../pages/OrderConfirmation'));
const AccountLayout = lazy(() => import('../pages/account/AccountLayout'));
const AccountDashboard = lazy(() => import('../pages/account/AccountDashboard'));
const MyOrders = lazy(() => import('../pages/account/MyOrders'));
const OrderDetail = lazy(() => import('../pages/account/OrderDetail'));
const Profile = lazy(() => import('../pages/account/Profile'));
const Addresses = lazy(() => import('../pages/account/Addresses'));
const AccountWishlist = lazy(() => import('../pages/account/Wishlist'));
const MyReviews = lazy(() => import('../pages/account/MyReviews'));
const Wallet = lazy(() => import('../pages/account/Wallet'));
const Orders = lazy(() => import('../pages/Orders'));
const WishlistPage = lazy(() => import('../pages/WishlistPage'));
const Blog = lazy(() => import('../pages/Blog'));
const BlogDetailsPage = lazy(() => import('../pages/BlogDetailsPage'));
const AboutUs = lazy(() => import('../pages/AboutUs'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const ContactUs = lazy(() => import('../pages/ContactUs'));
const Faqs = lazy(() => import('../pages/Faqs'));
const TermsAndConditions = lazy(() => import('../pages/TermsAndConditions'));
const NotFound = lazy(() => import('../pages/NotFound'));

/** Public storefront routes — checkout/admin code is not in this chunk. */
export default function StorefrontRoutes() {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/shop/category/:categorySlug/:productSlug" element={<LegacyCatalogProductRedirect />} />
        <Route path="/shop/category/:categorySlug" element={<LegacyCatalogCategoryRedirect />} />
        <Route path="/brand/:brandSlug" element={<Shop />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:slug" element={<ProductDetail />} />
        <Route path="/:categorySlug/:productSlug" element={<CatalogProductRoute />} />
        <Route path="/:categorySlug" element={<CatalogCategoryRoute />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/brands" element={<BrandsPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/products" element={<LegacyShopRedirect />} />
        <Route path="/product/:slug" element={<LegacyProductRedirect />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />

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
          <Route path="wallet" element={<Wallet />} />
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
        <Route path="/blog/:slug" element={<BlogDetailsPage />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
