import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trackCompleteRegistration } from '../lib/metaPixel';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import PasswordInput from '../components/PasswordInput';
import { authLoginBgUrl } from '../utils/seo';

function safeInternalPath(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s.startsWith('/') || s.startsWith('//')) return null;
  return s;
}

const Login = ({ defaultTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    referral: '',
    marketing: false
  });
  const [errors, setErrors] = useState({});
  const { login, register, loading, isAuthenticated, hasRole, firstStaffPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const nextFromState = safeInternalPath(location.state?.from?.pathname);
  const nextPath = nextFromState || safeInternalPath(searchParams.get('next'));
  const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
  const guestActivate = searchParams.get('activate') === '1';

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (!emailParam) return;
    const email = emailParam.trim();
    setLoginData((prev) => ({ ...prev, email }));
    setRegisterData((prev) => ({ ...prev, email }));
    if (guestActivate) {
      setActiveTab('register');
    }
  }, [searchParams, guestActivate]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    if (hasRole('admin')) {
      const adminDest =
        nextPath && nextPath.startsWith('/admin') ? nextPath : '/admin/dashboard';
      navigate(adminDest, { replace: true });
      return;
    }

    if (hasRole('staff')) {
      const staffDest =
        nextPath && nextPath.startsWith('/staff')
          ? nextPath
          : firstStaffPath || '/home';
      navigate(staffDest, { replace: true });
      return;
    }

    if (nextPath && !nextPath.startsWith('/admin') && !nextPath.startsWith('/staff')) {
      navigate(nextPath, { replace: true });
    }
  }, [
    loading,
    isAuthenticated,
    hasRole,
    nextPath,
    firstStaffPath,
    navigate
  ]);

  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.email) newErrors.email = 'Email is required';
    if (!loginData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!registerData.firstName) newErrors.firstName = 'First name is required';
    if (!registerData.lastName) newErrors.lastName = 'Last name is required';
    if (!registerData.email) newErrors.email = 'Email is required';
    if (!registerData.phone) newErrors.phone = 'Phone is required';
    if (!registerData.password) newErrors.password = 'Password is required';
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    const result = await login(loginData.email, loginData.password);
    if (result.success) {
      const u = result.user;
      const roles = Array.isArray(u?.roles) ? u.roles : [];
      if (roles.includes('admin')) {
        toast.success('Welcome back');
        const adminDest =
          nextPath && nextPath.startsWith('/admin') ? nextPath : '/admin/dashboard';
        navigate(adminDest, { replace: true });
        return;
      }

      if (roles.includes('staff')) {
        toast.success('Welcome back');
        navigate('/home', { replace: true });
        return;
      }

      if (nextPath?.startsWith('/admin') || nextPath?.startsWith('/staff')) {
        toast.error('This account cannot access that panel.');
        navigate('/home', { replace: true });
        return;
      }

      toast.success('Welcome back to Bazaar');
      navigate(nextPath || '/home');
    } else {
      if (result.code === 'USER_NOT_FOUND' || result.status === 404) {
        toast.error(result.error || 'Please register first.');
        setRegisterData((r) => ({ ...r, email: loginData.email.trim() }));
        setActiveTab('register');
        return;
      }
      if (result.code === 'GUEST_SET_PASSWORD') {
        toast(result.error || 'Set a password on the Register tab to access your orders.', {
          icon: 'ℹ️',
          duration: 6000
        });
        setRegisterData((r) => ({ ...r, email: loginData.email.trim() }));
        setActiveTab('register');
        return;
      }
      toast.error(result.error || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    const result = await register(registerData);
    if (result.success) {
      const activated = result.code === 'GUEST_ACCOUNT_ACTIVATED';
      trackCompleteRegistration({
        email: registerData.email,
        phone: registerData.phone
      });
      toast.success(
        activated
          ? 'Account ready — your orders are in My Orders'
          : 'Account created — welcome to Bazaar'
      );
      const dest =
        nextPath && !nextPath.startsWith('/admin')
          ? nextPath
          : activated
            ? '/account/orders'
            : '/home';
      navigate(dest);
    } else if (result.code === 'EMAIL_EXISTS') {
      toast.error(result.error || 'This email already has an account. Sign in instead.');
      setLoginData((l) => ({ ...l, email: registerData.email.trim() }));
      setActiveTab('login');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <>
      <SEO
        noIndex
        title={activeTab === 'register' ? 'Create account' : 'Sign in'}
        description={
          activeTab === 'register'
            ? 'Create a Bazaar account to track orders, save addresses, and checkout faster.'
            : 'Sign in to your Bazaar account to manage orders, profile, and wishlist.'
        }
      />
      <div
        className="auth-page auth-page--photo"
        style={{ '--auth-page-bg-image': `url("${authLoginBgUrl}")` }}
      >
        <div className="auth-page__shell">
          <div className="auth-page__panel">
            <div className="auth-page__brand">
              <Link to="/home" className="nav-logo" style={{ fontSize: '2rem', display: 'inline-block', marginBottom: '0.5rem' }}>
               Bazaar<span>.</span>
              </Link>
              <p className="auth-page__tagline">Your premium shopping destination</p>
            </div>

            <div className="auth-card auth-card--glass">
          <h1 className="auth-page__heading">
            {activeTab === 'register' ? 'Create your Bazaar account' : 'Sign in to Bazaar'}
          </h1>
          <div className="auth-tabs" role="tablist">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          {activeTab === 'login' && (
            <div className="auth-panel active">
              <h2 style={{ marginBottom: '0.35rem', fontSize: '1.5rem' }}>Welcome back</h2>
              <p style={{ marginBottom: '1.75rem', fontSize: '0.875rem' }}>Sign in to access your account</p>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label" htmlFor="loginEmail">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="loginEmail"
                    className="form-control"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="loginPassword">
                    Password <span className="required">*</span>
                  </label>
                  <PasswordInput
                    id="loginPassword"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>

                <p style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                    Forgot password?
                  </Link>
                </p>

                <button type="submit" className="btn btn-primary btn-full">
                  Sign In →
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray)', marginTop: '1.5rem' }}>
                Don&apos;t have an account?{' '}
                <Link
                  to={`/register${nextQuery}`}
                  style={{ color: 'var(--black)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Create one free
                </Link>
              </p>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="auth-panel active">
              <h2 style={{ marginBottom: '0.35rem', fontSize: '1.5rem' }}>Create your account</h2>
              {guestActivate ? (
                <p className="auth-guest-note" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Use the same email from checkout and set a password to see your orders in{' '}
                  <strong>My Orders</strong>.
                </p>
              ) : (
                <p style={{ marginBottom: '1.75rem', fontSize: '0.875rem' }}>Join thousands of happy shoppers</p>
              )}

              <form onSubmit={handleRegister}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">
                      First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="form-control"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      placeholder="John"
                      required
                    />
                    {errors.firstName && <div className="form-error">{errors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">
                      Last Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="form-control"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      placeholder="Smith"
                      required
                    />
                    {errors.lastName && <div className="form-error">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="registerEmail">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="registerEmail"
                    className="form-control"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-control"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    placeholder="+44 7911 123456"
                    required
                  />
                  {errors.phone && <div className="form-error">{errors.phone}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password <span className="required">*</span>
                  </label>
                  <PasswordInput
                    id="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                  />
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                  />
                  {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                </div>

                <button type="submit" className="btn btn-gold btn-full">
                  Create My Account →
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray)', marginTop: '1.5rem' }}>
                Already have an account?{' '}
                <Link to={`/login${nextQuery}`} style={{ color: 'var(--black)', fontWeight: 600, textDecoration: 'underline' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
