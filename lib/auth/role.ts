export type UserRole = 'admin' | 'customer';

export function resolveUserRole(user: any, profile?: any): UserRole {
  if (user?.app_metadata?.role === 'admin') {
    return 'admin';
  }

  if (profile?.role === 'admin') {
    return 'admin';
  }

  return 'customer';
}
