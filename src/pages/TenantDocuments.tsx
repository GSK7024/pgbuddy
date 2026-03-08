import { useEffect, useState } from "react";
import { FileText, Upload, CheckCircle, Clock, XCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Doc {
  id: string;
  document_type: string;
  document_name: string;
  url: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const docTypes = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving License" },
  { value: "college_id", label: "College ID" },
  { value: "agreement", label: "Rent Agreement" },
  { value: "other", label: "Other" },
];

const TenantDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assignment, setAssignment] = useState<{ property_id: string } | null>(null);

  const [docType, setDocType] = useState("aadhaar");
  const [file, setFile] = useState<File | null>(null);

  const fetchDocs = async () => {
    if (!user) return;
    const [docRes, assignRes] = await Promise.all([
      supabase.from("tenant_documents").select("*").eq("tenant_id", user.id).order("created_at", { ascending: false }),
      supabase.from("tenant_assignments").select("property_id").eq("tenant_id", user.id).eq("is_active", true).maybeSingle(),
    ]);
    setDocs(docRes.data ?? []);
    setAssignment(assignRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !assignment) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("tenant-documents").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("tenant-documents").getPublicUrl(path);

    const { error } = await supabase.from("tenant_documents").insert({
      tenant_id: user.id,
      property_id: assignment.property_id,
      document_type: docType,
      document_name: file.name,
      storage_path: path,
      url: urlData.publicUrl,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document uploaded!" });
      setDialogOpen(false);
      setFile(null);
      fetchDocs();
    }
    setUploading(false);
  };

  const statusIcon = (s: string) => {
    if (s === "approved") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "rejected") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-success";
    if (s === "rejected") return "bg-destructive";
    return "bg-warning";
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Documents</h1>
            <p className="text-muted-foreground">Upload and manage your ID proofs & agreements</p>
          </div>
          {assignment && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2">
                  <Plus className="w-4 h-4" /> Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {docTypes.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File *</Label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
                    <p className="text-xs text-muted-foreground">Accepted: Images, PDF (max 5MB)</p>
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : docs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
              <p className="text-muted-foreground">Upload your ID proof for verification by your PG owner</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {docs.map(d => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{docTypes.find(t => t.value === d.document_type)?.label || d.document_type}</p>
                      <p className="text-sm text-muted-foreground">{d.document_name} · {new Date(d.created_at).toLocaleDateString()}</p>
                      {d.notes && <p className="text-xs text-muted-foreground mt-1">Note: {d.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(d.status)}
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantDocuments;
