-- Right to Services: remember when an application's deadline was first breached,
-- so the SLA sweep escalates and notifies exactly once.
ALTER TABLE "Application" ADD COLUMN "slaBreachedAt" TIMESTAMP(3);

-- Tamper-evident audit trail: an append sequence plus a SHA-256 hash chain.
-- Existing rows keep NULL hashes and are reported as written before the chain.
ALTER TABLE "AuditLog" ADD COLUMN "hash" TEXT,
ADD COLUMN "prevHash" TEXT,
ADD COLUMN "seq" BIGSERIAL NOT NULL;

CREATE UNIQUE INDEX "AuditLog_seq_key" ON "AuditLog"("seq");
