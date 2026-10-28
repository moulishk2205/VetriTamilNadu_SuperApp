import { Role } from '@prisma/client'

/**
 * RBAC permission catalog — identical to the frontend's `lib/rbac/roles.ts`, so
 * the verify response carries the same permission set the UI already guards on.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  CITIZEN: ['citizen:read', 'citizen:write', 'application:create', 'application:read', 'complaint:create', 'complaint:read', 'document:read'],
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
