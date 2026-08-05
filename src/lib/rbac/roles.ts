/**
 * RBAC catalog — roles + permissions for every current and future portal.
 *
 * Phase 1 only ships the Citizen portal, but the model already encodes the
 * Officer / Department / MLA / Admin roles so their portals mount later behind
 * the same guard + permission checks — no auth rewrite.
 */

export type Role = 'citizen' | 'officer' | 'department' | 'mla' | 'admin'

export type Permission =
  | 'citizen:read' | 'citizen:write'
  | 'application:create' | 'application:read' | 'application:process'
  | 'complaint:create' | 'complaint:read' | 'complaint:resolve'
  | 'document:read' | 'document:issue'
  | 'analytics:read'
  | 'admin:manage'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  citizen: ['citizen:read', 'citizen:write', 'application:create', 'application:read', 'complaint:create', 'complaint:read', 'document:read'],
  officer: ['application:read', 'application:process', 'complaint:read', 'complaint:resolve', 'document:issue'],
  department: ['application:read', 'application:process', 'analytics:read'],
  mla: ['analytics:read'],
  admin: ['admin:manage', 'analytics:read', 'citizen:read', 'application:read', 'complaint:read'],
}

/** Home route per role — used when a future portal login lands the user. */
export const ROLE_HOME: Record<Role, string> = {
  citizen: '/home',
  officer: '/officer',
  department: '/department',
  mla: '/mla-portal',
  admin: '/admin',
}

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
