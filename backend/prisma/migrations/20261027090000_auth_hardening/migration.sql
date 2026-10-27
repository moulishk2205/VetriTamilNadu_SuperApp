-- Auth hardening (EOI readiness report §2, defects 1-6).

-- Demo persona sessions are recorded as such, not as OTP logins.
ALTER TYPE "AuthMethod" ADD VALUE 'DEMO';

-- Wrong-code counter: an OTP is deleted after 5 failed attempts.
ALTER TABLE "Otp" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- Existing rows hold raw mobile and Aadhaar numbers. Identifiers are now
-- stored as keyed hashes, so drop every old row (they expire in 5 minutes anyway).
DELETE FROM "Otp";

-- Every persona used to share the demo citizen's User row, and each login
-- overwrote its role. A user linked to a citizen is a citizen.
UPDATE "User" SET "role" = 'CITIZEN' WHERE "citizenId" IS NOT NULL AND "role" <> 'CITIZEN';

-- Refresh tokens issued under a drifted role are revoked: everyone signs in again.
UPDATE "RefreshToken" SET "revoked" = true WHERE "revoked" = false;
