import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { CheckCircle, IndianRupee, Printer, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentData {
  id: string;
  amount: number;
  month: string;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  properties: { name: string } | null;
  rooms: { room_number: string } | null;
  profiles: { full_name: string } | null;
}

const PublicReceipt = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!id) return;
      
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const res = await fetch(
          `${supabaseUrl}/functions/v1/get-receipt?id=${id}`,
          {
            headers: {
              "Authorization": `Bearer ${anonKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.receipt) {
          setPayment(json.receipt as PaymentData);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError(true);
      }
      setLoading(false);
    };

    fetchPayment();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3 mx-auto" />
            <Skeleton className="h-4 w-1/4 mx-auto" />
            <div className="space-y-2 pt-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Receipt Not Found</h1>
          <p className="text-slate-600 mb-6">The receipt you are looking for might have been moved or deleted.</p>
          <Button asChild variant="outline">
            <Link to="/" className="gap-2"><Home className="w-4 h-4" /> Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="overflow-hidden border-none shadow-xl print:shadow-none">
          <div className="h-2 bg-primary" />
          <CardContent className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl">
                <span>🏠 PG Buddy</span>
              </div>
              <p className="text-slate-500 uppercase tracking-widest text-xs font-semibold">Rent Payment Receipt</p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                <span>VERIFIED PAYMENT</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-slate-500 text-xs font-medium uppercase mb-1">Amount Received</p>
              <div className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-1">
                <IndianRupee className="w-6 h-6 text-slate-400" />
                {Number(payment.amount).toLocaleString()}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Receipt No</p>
                <p className="text-slate-900 font-semibold truncate">#{payment.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Payment Date</p>
                <p className="text-slate-900 font-semibold">
                  {payment.payment_date ? format(new Date(payment.payment_date), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Property</p>
                <p className="text-slate-900 font-semibold">{payment.properties?.name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Room</p>
                <p className="text-slate-900 font-semibold">Number {payment.rooms?.room_number || "—"}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tenant Name</p>
                <p className="text-slate-900 font-semibold text-lg">{payment.profiles?.full_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">For Month</p>
                <p className="text-slate-900 font-semibold">{payment.month}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Payment Method</p>
                <p className="text-slate-900 font-semibold capitalize">{payment.payment_method?.replace('_', ' ') || "—"}</p>
              </div>
            </div>

            {/* Reference Number */}
            {payment.transaction_id && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Transaction Ref No</p>
                <p className="text-slate-900 font-mono text-xs break-all bg-slate-50 p-2 rounded">{payment.transaction_id}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-8 border-t border-slate-100 text-center space-y-2">
              <p className="text-slate-400 text-[10px] leading-relaxed italic">
                This is a computer-generated receipt signed by PG Buddy. No physical signature is required.
              </p>
              <div className="flex items-center justify-center gap-1 text-slate-300">
                <span className="h-px w-8 bg-slate-200" />
                <span className="text-[10px] font-bold">POWERED BY PG BUDDY</span>
                <span className="h-px w-8 bg-slate-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 print:hidden">
          <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print Receipt
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
        
        <p className="text-center text-slate-400 text-xs print:hidden">
          Trouble with this receipt? Contact <a href="mailto:support@pgbuddy.in" className="text-primary hover:underline">support@pgbuddy.in</a>
        </p>
      </div>
    </div>
  );
};

export default PublicReceipt;
