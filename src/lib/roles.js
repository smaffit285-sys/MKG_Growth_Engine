export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
  MARKETING: 'marketing',
  READONLY: 'readonly',
}

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: ['*'],
  [ROLES.ADMIN]: [
    'customers.read',
    'customers.write',
    'reviews.moderate',
    'ugc.moderate',
    'rewards.manage',
    'analytics.read',
    'settings.manage',
  ],
  [ROLES.STAFF]: [
    'customers.read',
    'customers.write',
    'reviews.read',
    'ugc.read',
    'analytics.read',
  ],
  [ROLES.MARKETING]: [
    'customers.read',
    'reviews.moderate',
    'ugc.moderate',
    'analytics.read',
  ],
  [ROLES.READONLY]: [
    'customers.read',
    'analytics.read',
  ],
}

export function hasPermission(role, permission) {
  if (!role) return false

  const permissions = ROLE_PERMISSIONS[role] || []

  return permissions.includes('*') || permissions.includes(permission)
}
