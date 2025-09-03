export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  notes?: string;
  deliveryCost?: number;
  subtotal: number;
  total: number;
}

export interface InvoiceStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: string;
}
