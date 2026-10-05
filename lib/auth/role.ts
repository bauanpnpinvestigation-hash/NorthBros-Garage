export type UserRole = 'admin' | 'manager' | 'staff' | 'mechanic' | 'customer';

export function resolveUserRole(user: any, profile?: any): UserRole {
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

  const metadataRole = user?.app_metadata?.role;
  if (
    metadataRole === 'admin' ||
    metadataRole === 'manager' ||
    metadataRole === 'staff' ||
    metadataRole === 'mechanic'
  ) {
    return metadataRole;
  }

  return 'customer';
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'staff' || role === 'mechanic';
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin';
}
