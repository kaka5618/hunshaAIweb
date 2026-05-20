import GoogleAnalytics from "./google-analytics";
import ClarityAnalytics from "./clarity-analytics";
import VercelAnalytics from "./vercel-analytics";
import { analyticsConfig } from "@/constants/website";

export type AnalyticsProps = {
  readonly forceEnableInDevelopment?: boolean;
};

export function Analytics({ forceEnableInDevelopment = false }: AnalyticsProps = {}) {
  const { enableInDevelopment } = analyticsConfig;

  if (
    process.env.NODE_ENV !== "production" &&
    !enableInDevelopment &&
    !forceEnableInDevelopment
  ) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics />
      <ClarityAnalytics />
      <VercelAnalytics />
    </>
  );
}

export default Analytics;
