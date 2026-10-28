-- "Seek report": an officer asks a colleague a question about an application.
CREATE TABLE "ReportRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportRequest_assignedToId_idx" ON "ReportRequest"("assignedToId");
CREATE INDEX "ReportRequest_applicationId_idx" ON "ReportRequest"("applicationId");

ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
