import { addHours, addDays } from "date-fns";
import {
  BRIDAL_ANONYMOUS_SESSION_TTL_HOURS,
  BRIDAL_REPORT_TTL_DAYS,
  BRIDAL_UPLOAD_TTL_HOURS,
} from "./constants";
import type { BridalReportStatus } from "./types";

const paidStatuses: BridalReportStatus[] = ["paid", "generating", "ready"];

export function getBridalAnonymousSessionExpiry(now = new Date()) {
  return addHours(now, BRIDAL_ANONYMOUS_SESSION_TTL_HOURS);
}

export function getBridalUploadExpiry(now = new Date()) {
  return addHours(now, BRIDAL_UPLOAD_TTL_HOURS);
}

export function getBridalReportExpiry(now = new Date()) {
  return addDays(now, BRIDAL_REPORT_TTL_DAYS);
}

export function getBridalShareExpiry(now = new Date()) {
  return addDays(now, BRIDAL_REPORT_TTL_DAYS);
}

export function isBridalReportPaidStatus(status: BridalReportStatus) {
  return paidStatuses.includes(status);
}

export function resolvePaidReportStatus(hasPendingImages: boolean): BridalReportStatus {
  return hasPendingImages ? "generating" : "ready";
}
