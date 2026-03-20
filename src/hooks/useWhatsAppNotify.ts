import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type WhatsAppAction =
  | "send-rent-reminder"
  | "send-announcement"
  | "send-complaint-alert"
  | "send-vacancy-alert"
  | "send-payment-approval";

interface WhatsAppResult {
  sent?: number;
  total?: number;
  reason?: string;
  error?: string;
}

/**
 * Thin hook to dispatch WhatsApp notifications via the twilio-notifications edge function.
 * Non-blocking — errors are silently logged so the main user flow is never interrupted.
 */
export const useWhatsAppNotify = () => {
  const [loading, setLoading] = useState(false);

  const send = async (
    action: WhatsAppAction,
    params: Record<string, any>
  ): Promise<WhatsAppResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "twilio-notifications",
        { body: { action, ...params } }
      );

      if (error) {
        console.warn("[WhatsApp] Edge function error (non-fatal):", error.message);
        return null;
      }

      console.log(`[WhatsApp] ${action}:`, data);
      return data as WhatsAppResult;
    } catch (err: any) {
      console.warn("[WhatsApp] Dispatch failed (non-fatal):", err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { send, loading };
};
