export type UserRole = 'admin' | 'manager' | 'staff' | 'mechanic' | 'customer';

const STAFF_ROLES: UserRole[] = ['admin', 'manager', 'staff', 'mechanic'];

export function resolveUserRole(user: any, profile?: any): UserRole {
  // Authorization claims belong in app_metadata, which is not user-editable.
  // Prefer a valid staff claim over the profile so server/client role checks agree.
  const metadataRole = user?.app_metadata?.role;
  if (STAFF_ROLES.includes(metadataRole)) {
    return metadataRole;
  }

  const profileRole = profile?.role;
  if (
    profileRole === 'admin' ||
    profileRole === 'manager' ||
    profileRole === 'staff' ||
    profileRole === 'mechanic' ||
    profileRole === 'customer'
  ) {
    return profileRole;
  }

  return 'customer';
}

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin';
}
