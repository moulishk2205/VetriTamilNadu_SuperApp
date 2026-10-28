-- Grievance redressal: officers resolve grievances with a note the citizen sees.
ALTER TABLE "Complaint" ADD COLUMN "resolutionNote" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

-- Right to Services reminders: one "decision due soon" notice per application.
ALTER TABLE "Application" ADD COLUMN "slaRemindedAt" TIMESTAMP(3);
