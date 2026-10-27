-- Auth hardening (EOI readiness report §2: defects 1-6 and the "also confirmed" list).

-- Demo persona sessions are recorded as such, not as OTP logins.
ALTER TYPE "AuthMethod" ADD VALUE 'DEMO';

-- Wrong-code counter: an OTP is deleted after 5 failed attempts.
ALTER TABLE "Otp" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- Sessions can be ended (logout). Access tokens name their session, so ending
-- it revokes them immediately; refresh tokens belong to a session.
ALTER TABLE "Session" ADD COLUMN "endedAt" TIMESTAMP(3);
ALTER TABLE "RefreshToken" ADD COLUMN "sessionId" TEXT;
CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken"("sessionId");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing rows hold raw mobile and Aadhaar numbers. Identifiers are now
-- stored as keyed hashes, so drop every old row (they expire in 5 minutes anyway).
DELETE FROM "Otp";

-- Every persona used to share the demo citizen's User row, and each login
-- overwrote its role. A user linked to a citizen is a citizen.
UPDATE "User" SET "role" = 'CITIZEN' WHERE "citizenId" IS NOT NULL AND "role" <> 'CITIZEN';

-- Refresh tokens were stored in plaintext and may carry a drifted role. They
-- are now stored as SHA-256 hashes, so delete the old rows and end every open
-- session: everyone signs in again.
DELETE FROM "RefreshToken";
UPDATE "Session" SET "endedAt" = CURRENT_TIMESTAMP WHERE "endedAt" IS NULL;
