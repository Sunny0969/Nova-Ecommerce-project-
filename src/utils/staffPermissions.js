const STAFF_PERMISSION_ALIASES = {
  manageProducts: ['manageProducts', 'manage_products'],
  manageOrders: ['manageOrders', 'manage_orders'],
  manageCategories: ['manageCategories', 'manage_categories'],
  viewAnalytics: ['viewAnalytics', 'view_analytics'],
  manageCustomers: ['manageCustomers', 'manage_customers'],
  manageCoupons: ['manageCoupons', 'manage_coupons'],
  manageBlog: ['manageBlog', 'manage_blog']
};

export const STAFF_SECTION_SPECS = [
  { permission: 'manageProducts', label: 'Products', path: '/staff/products' },
  { permission: 'manageOrders', label: 'Orders', path: '/staff/orders' },
  { permission: 'manageCategories', label: 'Categories', path: '/staff/categories' },
  { permission: 'viewAnalytics', label: 'Analytics', path: '/staff/analytics' },
  { permission: 'manageCustomers', label: 'Customers', path: '/staff/customers' },
  { permission: 'manageCoupons', label: 'Coupons', path: '/staff/coupons' },
  { permission: 'manageBlog', label: 'Blog', path: '/staff/blog' }
];

export function normalizeStaffPermissions(rawPermissions) {
  if (Array.isArray(rawPermissions)) {
    return Object.fromEntries(
      Object.keys(STAFF_PERMISSION_ALIASES).map((canonicalKey) => [
        canonicalKey,
        rawPermissions.includes(canonicalKey)
      ])
    );
  }

  const source = rawPermissions && typeof rawPermissions === 'object' ? rawPermissions : {};

  return Object.fromEntries(
    Object.entries(STAFF_PERMISSION_ALIASES).map(([canonicalKey, aliases]) => [
      canonicalKey,
      aliases.some((alias) => source[alias] === true)
    ])
  );
}

export function hasAnyStaffPermission(permissions) {
  return Object.values(normalizeStaffPermissions(permissions)).some(Boolean);
}

export function permissionListFromMap(permissions) {
  return Object.entries(normalizeStaffPermissions(permissions))
    .filter(([, allowed]) => allowed === true)
    .map(([key]) => key);
}

export function getGrantedStaffSections(permissions) {
  const normalized = normalizeStaffPermissions(permissions);
  return STAFF_SECTION_SPECS.filter((section) => normalized[section.permission]);
}

export function getFirstAllowedStaffPath(permissions) {
  return getGrantedStaffSections(permissions)[0]?.path || '';
}

export function getFirstAllowedAdminPath(permissions) {
  const normalized = normalizeStaffPermissions(permissions);

  if (normalized.viewAnalytics) return '/admin/dashboard';
  if (normalized.manageProducts) return '/admin/products';
  if (normalized.manageOrders) return '/admin/orders';
  if (normalized.manageCategories) return '/admin/categories';
  if (normalized.manageCustomers) return '/admin/customers';
  if (normalized.manageCoupons) return '/admin/coupons';

  return '';
}
