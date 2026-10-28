-- Maker-checker: remember which officer recommended a case into approval, so a
-- different officer must approve it.
ALTER TABLE "Application" ADD COLUMN "makerOfficerId" TEXT;
