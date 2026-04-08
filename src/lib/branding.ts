/**
 * Centralized branding logic for White-Labeling the PG Software.
 * This reads from Vite environment variables to dynamically replace "PG Buddy"
 * with a client's custom name and logo.
 */

export const isWhiteLabel = import.meta.env.VITE_IS_WHITE_LABEL === "true";

export const getAppName = (): string => {
  return isWhiteLabel && import.meta.env.VITE_APP_NAME 
    ? import.meta.env.VITE_APP_NAME 
    : "PG Buddy";
};

export const getAppLogo = (): string => {
  // If white labeled, we assume custom-logo.png is placed in the public folder
  return isWhiteLabel ? "/custom-logo.png" : "/lovable-uploads/23dc2ea5-c637-4d08-a5b6-c5db16b801a2.png";
};
