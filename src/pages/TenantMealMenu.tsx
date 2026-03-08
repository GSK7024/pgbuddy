import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import TenantLayout from "@/components/dashboard/TenantLayout";

const TenantMealMenu = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tenant_assignments")
      .select("property_id")
      .eq("tenant_id", user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPropertyId(data.property_id);
      });
  }, [user]);

  useEffect(() => {
    if (!propertyId) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const weekEnd = format(addDays(new Date(), 6), "yyyy-MM-dd");
    supabase
      .from("meal_menus")
      .select("*")
      .eq("property_id", propertyId)
      .gte("menu_date", today)
      .lte("menu_date", weekEnd)
      .order("menu_date")
      .then(({ data }) => {
        if (data) setMenus(data);
      });
  }, [propertyId]);

  const todayMenu = menus.find((m) => m.menu_date === format(new Date(), "yyyy-MM-dd"));
  const selectedMenu = menus.find((m) => m.menu_date === selectedDate);

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, dd MMM") };
  });

  const mealFields = [
    { key: "breakfast" as const, label: t("meal.breakfast"), emoji: "🌅" },
    { key: "lunch" as const, label: t("meal.lunch"), emoji: "☀️" },
    { key: "snacks" as const, label: t("meal.snacks"), emoji: "🍪" },
    { key: "dinner" as const, label: t("meal.dinner"), emoji: "🌙" },
  ];

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            {t("meal.title")}
          </h1>
          <p className="text-muted-foreground">{t("meal.tenantSubtitle")}</p>
        </div>

        {/* Today's highlight */}
        {todayMenu && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("meal.todayMenu")} 🍽️</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mealFields.map((f) => (
                  <div key={f.key} className="text-center p-3 rounded-lg bg-card border">
                    <div className="text-lg mb-1">{f.emoji}</div>
                    <div className="text-xs text-muted-foreground font-medium">{f.label}</div>
                    <div className="text-sm font-semibold mt-1">{todayMenu[f.key] || "—"}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date picker */}
        <div className="flex gap-2 flex-wrap">
          {dateOptions.map((d) => (
            <Button
              key={d.value}
              variant={selectedDate === d.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(d.value)}
              className={selectedDate === d.value ? "gradient-primary" : ""}
            >
              {d.label}
            </Button>
          ))}
        </div>

        {selectedMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealFields.map((f) => (
              <Card key={f.key}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{f.emoji}</span>
                    <div>
                      <div className="text-sm text-muted-foreground">{f.label}</div>
                      <div className="font-semibold">{selectedMenu[f.key] || "—"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t("meal.noMenu")}
            </CardContent>
          </Card>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantMealMenu;
