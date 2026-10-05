export type UserRole = 'admin' | 'manager' | 'staff' | 'mechanic' | 'customer';

export function resolveUserRole(user: any, profile?: any): UserRole {
  const metadataRole = user?.app_metadata?.role;
  const profileRole = profile?.role;
  const role = metadataRole || profileRole;

  if (
    role === 'admin' ||
    role === 'manager' ||
    role === 'staff' ||
    role === 'mechanic'
  ) {
    return role;
  }

  return 'customer';
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'staff' || role === 'mechanic';
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin';
}
