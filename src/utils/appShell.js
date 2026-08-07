/** Which top-level app shell should handle this pathname (admin / staff / storefront). */
export function resolveAppShellKey(pathname) {
  const path = String(pathname || '');
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/staff')) return 'staff';
  return 'storefront';
}

export function isAdminPath(pathname) {
  return resolveAppShellKey(pathname) === 'admin';
}

export function isStaffPath(pathname) {
  return resolveAppShellKey(pathname) === 'staff';
}
