-- Add service report and feedback notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SERVICE_REPORT_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FEEDBACK_SUBMITTED';
