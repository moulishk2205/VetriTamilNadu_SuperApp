-- Per-stage SLA (E5): each stage with an SLA gets its own deadline, counted in
-- working days; a missed stage deadline is flagged once.
ALTER TABLE "Application" ADD COLUMN     "stageBreachedAt" TIMESTAMP(3),
ADD COLUMN     "stageDeadline" TIMESTAMP(3);

-- Holiday calendar: deadlines skip Sundays and these dates.
CREATE TABLE "Holiday" (
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("date")
);

-- Fixed-date public holidays. Festival holidays whose dates follow the lunar
-- calendar (Pongal, Deepavali, Ramzan, …) are added each year from the
-- Government Order, in Admin → Holidays.
INSERT INTO "Holiday" ("date", "name") VALUES
  ('2026-01-01', 'New Year''s Day'), ('2026-01-26', 'Republic Day'), ('2026-04-14', 'Tamil New Year / Dr. Ambedkar Jayanthi'),
  ('2026-05-01', 'May Day'), ('2026-08-15', 'Independence Day'), ('2026-10-02', 'Gandhi Jayanthi'), ('2026-12-25', 'Christmas'),
  ('2027-01-01', 'New Year''s Day'), ('2027-01-26', 'Republic Day'), ('2027-04-14', 'Tamil New Year / Dr. Ambedkar Jayanthi'),
  ('2027-05-01', 'May Day'), ('2027-08-15', 'Independence Day'), ('2027-10-02', 'Gandhi Jayanthi'), ('2027-12-25', 'Christmas');
