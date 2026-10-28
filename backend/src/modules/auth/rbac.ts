import { Role } from '@prisma/client'

/** Every permission the platform enforces, with the label the admin screen shows. */
export const PERMISSION_CATALOG: { key: string; label: string }[] = [
  { key: 'citizen:read', label: 'View citizen profiles' },
  { key: 'citizen:write', label: 'Edit own citizen profile' },
  { key: 'application:create', label: 'File applications' },
  { key: 'application:read', label: 'View applications' },
  { key: 'application:process', label: 'Process applications (approve, reject, return)' },
  { key: 'complaint:create', label: 'File grievances' },
  { key: 'complaint:read', label: 'View grievances' },
  { key: 'complaint:resolve', label: 'Act on grievances' },
  { key: 'document:read', label: 'Open wallet documents' },
  { key: 'document:issue', label: 'Issue documents' },
  { key: 'analytics:read', label: 'View dashboards and analytics' },
  { key: 'admin:manage', label: 'Administer the platform' },
]

/**
 * Default permissions per role. The live matrix is stored in RolePermission and
 * edited from the admin portal; these defaults seed it (and mirror the
 * frontend's `lib/rbac/roles.ts`).
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  CITIZEN: ['citizen:read', 'citizen:write', 'application:create', 'application:read', 'complaint:create', 'complaint:read', 'document:read', 'analytics:read'],
  OFFICER: ['application:read', 'application:process', 'complaint:read', 'complaint:resolve', 'document:issue'],
  DEPARTMENT: ['application:read', 'application:process', 'analytics:read'],
  MLA: ['analytics:read'],
  ADMIN: ['admin:manage', 'analytics:read', 'citizen:read', 'application:read', 'complaint:read'],
  SUPPORT: ['citizen:read', 'complaint:read'],
}

export const ROLE_HOME: Record<Role, string> = {
  CITIZEN: '/home',
  OFFICER: '/officer',
  DEPARTMENT: '/department',
  MLA: '/mla-portal',
  ADMIN: '/admin',
  SUPPORT: '/support',
}
