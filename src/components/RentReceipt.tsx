import { useRef } from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptProps {
  payment: {
    id: string;
    amount: number;
    month: string;
    payment_date: string | null;
    status: string;
    payment_type?: string;
    payment_method?: string | null;
    transaction_id?: string | null;
    properties?: { name: string; owner_name?: string; address?: string } | null;
    rooms?: { room_number: string } | null;
  };
  tenantName?: string;
}

const RentReceipt = ({ payment, tenantName }: ReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    
    const isDeposit = payment.payment_type === "deposit";
    const receiptTitle = isDeposit ? "SECURITY DEPOSIT RECEIPT" : "RENT PAYMENT RECEIPT";
    const lineItemDesc = isDeposit ? "Security Deposit" : `Monthly Rent — ${payment.month}`;
    const formattedDate = payment.payment_date ? format(new Date(payment.payment_date), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy");
    const receiptNo = `PGB-${payment.id.slice(0, 8).toUpperCase()}`;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${payment.month}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
          
          body { 
            font-family: 'Inter', system-ui, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            color: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 30px;
            margin-bottom: 40px;
          }
          
          .brand {
            font-size: 24px;
            font-weight: 700;
            color: #7c3aed;
          }
          
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
            font-weight: 500;
          }
          
          .title-area {
            text-align: right;
          }
          
          .title-area h1 {
            font-size: 20px;
            font-weight: 900;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
          }
          
          .meta-info {
            font-size: 14px;
            color: #64748b;
            margin: 4px 0;
            font-weight: 500;
          }
          
          .meta-info span {
            color: #0f172a;
            font-weight: 600;
          }
          
          .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          
          .party-box {
            width: 45%;
          }
          
          .party-box.right {
            text-align: right;
          }
          
          .party-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          
          .party-name {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px 0;
          }
          
          .party-detail {
            font-size: 14px;
            color: #475569;
            margin: 2px 0;
          }
          
          .party-detail span {
            font-weight: 600;
            color: #0f172a;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          
          th {
            background-color: #f8fafc;
            padding: 16px 24px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
          }
          
          th.right {
            text-align: right;
          }
          
          td {
            padding: 20px 24px;
            font-size: 15px;
            font-weight: 500;
            border-bottom: 1px solid #f1f5f9;
          }
          
          td.right {
            text-align: right;
            font-weight: 700;
          }
          
          tr.total td {
            background-color: #f8fafc;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: none;
          }
          
          tr.total td.right {
            font-size: 24px;
            font-weight: 900;
            color: #7c3aed;
          }
          
          .transaction-info {
            background-color: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .tx-details p {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .tx-details div {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }
          
          .tx-details .method {
            text-transform: uppercase;
          }
          
          .badge {
            background-color: #dcfce7;
            color: #166534;
            padding: 8px 16px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 700;
            border: 1px solid #bbf7d0;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #f1f5f9;
          }
          
          .footer p {
            color: #64748b;
            font-size: 11px;
            font-style: italic;
            margin: 0 0 16px 0;
          }
          
          .powered-by {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #cbd5e1;
          }
          
          .line {
            height: 1px;
            width: 40px;
            background-color: #e2e8f0;
          }
          
          .powered-text {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
          }
          
          @media print { 
            body { padding: 20px; } 
            .transaction-info { border: 1px solid #cbd5e1; }
            table { border: 1px solid #cbd5e1; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">🏠 PG Buddy</div>
            <div class="brand-sub">Digital Receipt Validation</div>
          </div>
          <div class="title-area">
            <h1>${receiptTitle}</h1>
            <div class="meta-info">Receipt No: <span>${receiptNo}</span></div>
            <div class="meta-info">Date: <span>${formattedDate}</span></div>
          </div>
        </div>
        
        <div class="parties">
          <div class="party-box">
            <div class="party-label">Received From</div>
            <h2 class="party-name">${tenantName || "Tenant"}</h2>
            <div class="party-detail">Room: <span>${payment.rooms?.room_number || "—"}</span></div>
          </div>
          <div class="party-box right">
            <div class="party-label">Paid To</div>
            <h2 class="party-name">${payment.properties?.name || "PG Owner"}</h2>
            ${payment.properties?.owner_name ? `<div class="party-detail">${payment.properties.owner_name}</div>` : ''}
            ${payment.properties?.address ? `<div class="party-detail">${payment.properties.address}</div>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${lineItemDesc}</td>
              <td class="right">₹${Number(payment.amount).toLocaleString()}</td>
            </tr>
            <tr class="total">
              <td>Total Paid</td>
              <td class="right">₹${Number(payment.amount).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="transaction-info">
          <div>
            <div class="tx-details" style="margin-bottom: 12px;">
              <p>Payment Method</p>
              <div class="method">${payment.payment_method?.replace('_', ' ') || "—"}</div>
            </div>
            ${payment.transaction_id ? `
            <div class="tx-details">
              <p>Transaction Ref</p>
              <div style="font-family: monospace;">${payment.transaction_id}</div>
            </div>
            ` : ''}
          </div>
          <div class="badge">
            ✓ PAYMENT VERIFIED
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated receipt signed by PG Buddy. No physical signature is required.</p>
          <div class="powered-by">
            <div class="line"></div>
            <div class="powered-text">Powered by PG Buddy</div>
            <div class="line"></div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    
    // Give time for font to load before printing
    setTimeout(() => {
      win.print();
    }, 500);
  };

  if (payment.status !== "paid") return null;

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
      <FileText className="w-3 h-3" />
      Receipt
    </Button>
  );
};

export default RentReceipt;
