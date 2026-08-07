import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DelayedSuspense from '../components/DelayedSuspense';
import { PageSuspenseFallback } from '../components/RouteFallback';

const Home = lazy(() => import(/* webpackChunkName: "home" */ '../pages/Home'));
const Shop = lazy(() => import(/* webpackChunkName: "shop" */ '../pages/Products'));
const ProductDetail = lazy(() => import(/* webpackChunkName: "product-detail" */ '../pages/ProductDetail'));
const CatalogCategoryRoute = lazy(() =>
  import(/* webpackChunkName: "catalog-routes" */ '../pages/CatalogRoutes').then((m) => ({
    default: m.CatalogCategoryRoute
  }))
);
const CatalogProductRoute = lazy(() =>
  import(/* webpackChunkName: "catalog-routes" */ '../pages/CatalogRoutes').then((m) => ({
    default: m.CatalogProductRoute
  }))
);
const LegacyCatalogProductRedirect = lazy(() =>
  import(/* webpackChunkName: "catalog-routes" */ '../pages/CatalogRoutes').then((m) => ({
    default: m.LegacyCatalogProductRedirect
  }))
);
const LegacyCatalogCategoryRedirect = lazy(() =>
  import(/* webpackChunkName: "catalog-routes" */ '../pages/CatalogRoutes').then((m) => ({
    default: m.LegacyCatalogCategoryRedirect
  }))
);

const BrandsPage = lazy(() => import(/* webpackChunkName: "brands-page" */ '../pages/BrandsPage'));
const CategoryPage = lazy(() => import(/* webpackChunkName: "category-page" */ '../pages/CategoryPage'));
const LegacyShopRedirect = lazy(() => import(/* webpackChunkName: "legacy-shop-redirect" */ '../pages/LegacyShopRedirect'));
const LegacyProductRedirect = lazy(() =>
  import(/* webpackChunkName: "legacy-product-redirect" */ '../pages/LegacyProductRedirect')
);
const Login = lazy(() => import(/* webpackChunkName: "login" */ '../pages/Login'));
const Register = lazy(() => import(/* webpackChunkName: "register" */ '../pages/Register'));
const ForgotPassword = lazy(() => import(/* webpackChunkName: "forgot-password" */ '../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import(/* webpackChunkName: "reset-password" */ '../pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import(/* webpackChunkName: "verify-email" */ '../pages/auth/VerifyEmail'));
const Cart = lazy(() => import(/* webpackChunkName: "cart" */ '../pages/Cart'));
const Checkout = lazy(() => import(/* webpackChunkName: "checkout" */ '../pages/Checkout'));
const OrderConfirmation = lazy(() =>
  import(/* webpackChunkName: "order-confirmation" */ '../pages/OrderConfirmation')
);
const AccountLayout = lazy(() => import(/* webpackChunkName: "account-layout" */ '../pages/account/AccountLayout'));
const AccountDashboard = lazy(() =>
  import(/* webpackChunkName: "account-dashboard" */ '../pages/account/AccountDashboard')
);
const MyOrders = lazy(() => import(/* webpackChunkName: "my-orders" */ '../pages/account/MyOrders'));
const OrderDetail = lazy(() => import(/* webpackChunkName: "order-detail" */ '../pages/account/OrderDetail'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ '../pages/account/Profile'));
const Addresses = lazy(() => import(/* webpackChunkName: "addresses" */ '../pages/account/Addresses'));
const AccountWishlist = lazy(() => import(/* webpackChunkName: "account-wishlist" */ '../pages/account/Wishlist'));
const MyReviews = lazy(() => import(/* webpackChunkName: "my-reviews" */ '../pages/account/MyReviews'));
const Wallet = lazy(() => import(/* webpackChunkName: "wallet" */ '../pages/account/Wallet'));
const Orders = lazy(() => import(/* webpackChunkName: "orders" */ '../pages/Orders'));
const WishlistPage = lazy(() => import(/* webpackChunkName: "wishlist-page" */ '../pages/WishlistPage'));
const Blog = lazy(() => import(/* webpackChunkName: "blog" */ '../pages/Blog'));
const BlogDetailsPage = lazy(() => import(/* webpackChunkName: "blog-details" */ '../pages/BlogDetailsPage'));
const AboutUs = lazy(() => import(/* webpackChunkName: "about-us" */ '../pages/AboutUs'));
const PrivacyPolicy = lazy(() => import(/* webpackChunkName: "privacy-policy" */ '../pages/PrivacyPolicy'));
const ContactUs = lazy(() => import(/* webpackChunkName: "contact-us" */ '../pages/ContactUs'));
const Faqs = lazy(() => import(/* webpackChunkName: "faqs" */ '../pages/Faqs'));
const TermsAndConditions = lazy(() =>
  import(/* webpackChunkName: "terms-and-conditions" */ '../pages/TermsAndConditions')
);
const ReturnsRefundPolicy = lazy(() =>
  import(/* webpackChunkName: "returns-refund-policy" */ '../pages/ReturnsRefundPolicy')
);
const ShippingPolicy = lazy(() => import(/* webpackChunkName: "shipping-policy" */ '../pages/ShippingPolicy'));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ '../pages/NotFound'));

/** Public storefront routes — each page is an async chunk; admin/staff never load here. */
export default function StorefrontRoutes() {
  return (
    <DelayedSuspense delayMs={180} fallback={<PageSuspenseFallback />}>
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
        <Route path="/returns-and-refunds" element={<ReturnsRefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </DelayedSuspense>
  );
}
