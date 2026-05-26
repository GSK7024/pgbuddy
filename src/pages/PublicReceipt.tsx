import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { CheckCircle, IndianRupee, Printer, Home, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";

interface PaymentData {
  id: string;
  amount: number;
  month: string;
  payment_date: string | null;
  status: string;
  payment_type: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  properties: { 
    name: string; 
    address?: string;
    owner_name?: string;
    owner_phone?: string;
  } | null;
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

  const handleShare = () => {
    const text = `Rent Receipt for ${payment?.month} is available here: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-12 w-1/3 mx-auto" />
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

  const isDeposit = payment.payment_type === "deposit";
  const receiptTitle = isDeposit ? "SECURITY DEPOSIT RECEIPT" : "RENT PAYMENT RECEIPT";
  const lineItemDesc = isDeposit ? "Security Deposit" : `Monthly Rent — ${payment.month}`;
  
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <Card className="overflow-hidden border-none shadow-xl print:shadow-none print:border-none bg-white rounded-xl">
          <div className="h-3 bg-primary" />
          <CardContent className="p-8 sm:p-12">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-slate-100 pb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-3xl">
                  <span>🏠 PG Buddy</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Digital Receipt Validation</div>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{receiptTitle}</h1>
                <div className="text-slate-500 font-medium">Receipt No. <span className="text-slate-900">PGB-{payment.id.slice(0, 8).toUpperCase()}</span></div>
                <div className="text-slate-500 font-medium">Date: <span className="text-slate-900">{payment.payment_date ? format(new Date(payment.payment_date), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}</span></div>
              </div>
            </div>

            {/* From / To section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Received From</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-slate-900">{payment.profiles?.full_name || "Tenant"}</p>
                  <p className="text-sm text-slate-600">Room: <span className="font-semibold text-slate-900">{payment.rooms?.room_number || "—"}</span></p>
                </div>
              </div>
              
              <div className="space-y-3 sm:text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid To</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-slate-900">{payment.properties?.name || "PG Owner"}</p>
                  {payment.properties?.owner_name && (
                    <p className="text-sm text-slate-600 font-medium">{payment.properties.owner_name}</p>
                  )}
                  {payment.properties?.address && (
                    <p className="text-sm text-slate-500">{payment.properties.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Table */}
            <div className="mb-10 rounded-lg overflow-hidden border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-sm font-bold text-slate-700 uppercase">Description</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-700 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-5 px-6 text-slate-900 font-medium">{lineItemDesc}</td>
                    <td className="py-5 px-6 text-slate-900 font-bold text-right flex justify-end items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-slate-500" />
                      {Number(payment.amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td className="py-4 px-6 text-sm font-bold text-slate-900 text-right uppercase">Total Paid</td>
                    <td className="py-4 px-6 text-xl font-black text-primary text-right flex justify-end items-center gap-1">
                      <IndianRupee className="w-5 h-5 text-primary" />
                      {Number(payment.amount).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Transaction Details & QR */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="space-y-4 w-full sm:w-auto">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{payment.payment_method?.replace('_', ' ') || "—"}</p>
                </div>
                {payment.transaction_id && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Ref</p>
                    <p className="text-sm font-mono font-medium text-slate-900">{payment.transaction_id}</p>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-bold border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  <span>PAYMENT VERIFIED</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <QRCodeSVG value={window.location.href} size={80} level="M" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Scan to verify</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-100 text-center space-y-2">
              <p className="text-slate-500 text-xs leading-relaxed italic">
                This is a computer-generated receipt signed by PG Buddy. No physical signature is required.
              </p>
              <div className="flex items-center justify-center gap-3 text-slate-300 pt-2">
                <span className="h-px w-12 bg-slate-200" />
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Powered by PG Buddy</span>
                <span className="h-px w-12 bg-slate-200" />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 print:hidden justify-center max-w-md mx-auto">
          <Button variant="default" className="flex-1 gap-2 gradient-primary shadow-lg shadow-primary/20" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="outline" className="flex-1 gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
        
        <p className="text-center text-slate-400 text-xs print:hidden font-medium">
          Trouble with this receipt? Contact <a href="mailto:support@pgbuddy.in" className="text-primary hover:underline font-semibold">support@pgbuddy.in</a>
        </p>
      </div>
    </div>
  );
};

export default PublicReceipt;
