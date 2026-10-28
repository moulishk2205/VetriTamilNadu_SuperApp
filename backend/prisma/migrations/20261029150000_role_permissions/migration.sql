-- Editable role-based access: the role → permission matrix lives in the
-- database, is edited from the admin portal and is enforced on every request.
CREATE TABLE "RolePermission" (
    "role" "Role" NOT NULL,
    "permission" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role","permission")
);

-- Defaults (same as backend/src/modules/auth/rbac.ts ROLE_PERMISSIONS).
INSERT INTO "RolePermission" ("role", "permission") VALUES
  ('CITIZEN', 'citizen:read'), ('CITIZEN', 'citizen:write'), ('CITIZEN', 'application:create'), ('CITIZEN', 'application:read'),
  ('CITIZEN', 'complaint:create'), ('CITIZEN', 'complaint:read'), ('CITIZEN', 'document:read'), ('CITIZEN', 'analytics:read'),
  ('OFFICER', 'application:read'), ('OFFICER', 'application:process'), ('OFFICER', 'complaint:read'), ('OFFICER', 'complaint:resolve'), ('OFFICER', 'document:issue'),
  ('DEPARTMENT', 'application:read'), ('DEPARTMENT', 'application:process'), ('DEPARTMENT', 'analytics:read'),
  ('MLA', 'analytics:read'),
  ('ADMIN', 'admin:manage'), ('ADMIN', 'analytics:read'), ('ADMIN', 'citizen:read'), ('ADMIN', 'application:read'), ('ADMIN', 'complaint:read'),
  ('SUPPORT', 'citizen:read'), ('SUPPORT', 'complaint:read');
