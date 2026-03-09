import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { UtensilsCrossed, CalendarDays, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useStaffAccess } from "@/hooks/useStaffAccess";

const MealMenu = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [menu, setMenu] = useState({ breakfast: "", lunch: "", dinner: "", snacks: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("properties").select("id, name").eq("owner_id", user.id).then(({ data }) => {
      if (data && data.length > 0) {
        setProperties(data);
        setSelectedProperty(data[0].id);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!selectedProperty || !selectedDate) return;
    supabase
      .from("meal_menus")
      .select("*")
      .eq("property_id", selectedProperty)
      .eq("menu_date", selectedDate)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMenu({ breakfast: data.breakfast || "", lunch: data.lunch || "", dinner: data.dinner || "", snacks: data.snacks || "" });
        } else {
          setMenu({ breakfast: "", lunch: "", dinner: "", snacks: "" });
        }
      });
  }, [selectedProperty, selectedDate]);

  const handleSave = async () => {
    if (!selectedProperty) return;
    setSaving(true);
    const { error } = await supabase.from("meal_menus").upsert(
      {
        property_id: selectedProperty,
        menu_date: selectedDate,
        ...menu,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "property_id,menu_date" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("meal.saved") });
    }
  };

  // Generate next 7 days for quick selection
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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            {t("meal.title")}
          </h1>
          <p className="text-muted-foreground">{t("meal.subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {properties.length > 1 && (
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealFields.map((field) => (
            <Card key={field.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{field.emoji}</span>
                  {field.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder={`Enter ${field.label.toLowerCase()} items...`}
                  value={menu[field.key]}
                  onChange={(e) => setMenu((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="gradient-primary">
          <Save className="w-4 h-4 mr-2" />
          {t("meal.save")}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default MealMenu;
