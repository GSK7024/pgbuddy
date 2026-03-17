import { Bell, BellOff, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } =
    usePushNotifications();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      toast({ title: "App installed!", description: "PG Buddy has been added to your home screen" });
    }
    setDeferredPrompt(null);
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast({ title: "Push notifications disabled" });
    } else {
      const success = await subscribe();
      if (success) {
        toast({ title: "Push notifications enabled!", description: "You'll receive alerts for rent, complaints & more" });
      } else if (permission === "denied") {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Install Card */}
      {!isInstalled && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Install PG Buddy</h3>
                  <p className="text-xs text-muted-foreground">
                    {deferredPrompt
                      ? "Add to your home screen for quick access"
                      : "Open in your phone browser → Share → Add to Home Screen"}
                  </p>
                </div>
              </div>
              {deferredPrompt && (
                <Button size="sm" onClick={handleInstall}>
                  <Download className="w-4 h-4 mr-1" /> Install
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Push Notifications Card */}
      {isSupported && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSubscribed ? "bg-green-500/10" : "bg-muted"}`}>
                  {isSubscribed ? (
                    <Bell className="w-5 h-5 text-green-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Push Notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed
                      ? "You'll receive rent reminders, complaints & notices"
                      : "Enable to get alerts on your phone"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isSubscribed ? "outline" : "default"}
                onClick={handlePushToggle}
                disabled={isLoading}
              >
                {isLoading ? "..." : isSubscribed ? "Disable" : "Enable"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isInstalled && (
        <p className="text-xs text-muted-foreground text-center">
          ✅ App is installed on your device
        </p>
      )}
    </div>
  );
};

export default InstallPWA;
