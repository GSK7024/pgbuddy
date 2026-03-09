import { AlertTriangle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface OverLimitBannerProps {
  tenantCount: number;
  tenantLimit: number;
  planName: string;
}

const OverLimitBanner = ({ tenantCount, tenantLimit, planName }: OverLimitBannerProps) => {
  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">Account Over Limit — Read-Only Mode</AlertTitle>
      <AlertDescription className="mt-1 space-y-2">
        <p>
          You have <strong>{tenantCount} active tenants</strong> but your <strong>{planName}</strong> plan only allows <strong>{tenantLimit}</strong>.
          Rent generation, announcements, and tenant management are disabled until you upgrade or reduce tenants.
        </p>
        <div className="flex gap-2 mt-3">
          <Button asChild size="sm">
            <Link to="/dashboard/subscription">
              <Crown className="w-4 h-4 mr-1.5" />
              Upgrade Plan
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default OverLimitBanner;
