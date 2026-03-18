import { AlertTriangle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface OverLimitBannerProps {
  bedCount: number;
  bedLimit: number;
  planName: string;
}

const OverLimitBanner = ({ bedCount, bedLimit, planName }: OverLimitBannerProps) => {
  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">Bed Limit Reached — Upgrade Required</AlertTitle>
      <AlertDescription className="mt-1 space-y-2">
        <p>
          You have <strong>{bedCount} beds</strong> but your <strong>{planName}</strong> plan only allows <strong>{bedLimit}</strong>.
          You cannot add more rooms or beds until you upgrade your plan.
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
