// ng add jspdf + jspdf-autotable first (or install via npm):
// npm i jspdf jspdf-autotable

import { Injectable } from '@angular/core';
import jsPDF, { jsPDFOptions } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { CartItem } from '../../types/api.types';
import { toast } from 'ngx-sonner';

export interface ReceiptData {
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerWhatsapp?: string;
  deliveryLocation: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  date: Date;
}

type AnyItem = CartItem & {
  titleSnap?: string;
  unitPriceSnap?: string | number;
  qty: number;
};

@Injectable({ providedIn: 'root' })
export class ReceiptGeneratorService {
  // Brand tokens – tweak to your brand
  private readonly brand = {
    primary: [99, 102, 241] as [number, number, number],   // #6366F1
    ink: [55, 65, 81] as [number, number, number],         // #374151
    muted: [107, 114, 128] as [number, number, number],    // #6B7280
    border: [229, 231, 235] as [number, number, number],   // #E5E7EB
  };

  async generateReceipt(data: ReceiptData): Promise<void> {
    try {
      const logo = await this.loadImage('/logo.png').catch(() => null);

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
        putOnlyUsedFonts: true,
      } as jsPDFOptions);

      // PDF metadata
      doc.setProperties({
        title: `Receipt ${data.orderCode}`,
        subject: 'Order Receipt',
        author: 'GEOResinStore',
        creator: 'GEOResinStore',
        keywords: `receipt, order, ${data.orderCode}`,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = { top: 42, right: 16, bottom: 22, left: 16 }; // room for header & footer

      // Page decorator: header, footer, watermark
      const renderHeaderFooter = (d: ReceiptData) => {
        // HEADER
        // line under header
        doc.setDrawColor(...this.brand.border);
        doc.setLineWidth(0.3);
        doc.line(margin.left, 30, pageWidth - margin.right, 30);

        // logo
        if (logo) {
          const logoHeight = 14;
          const logoWidth = logo.width * (logoHeight / logo.height);
          doc.addImage(logo, 'PNG', margin.left, 12, logoWidth, logoHeight, undefined, 'FAST');
        }

        // brand + title
        doc.setTextColor(...this.brand.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const brandX = margin.left + (logo ? 18 : 0);
        doc.text('GEOResinStore', brandX, 20, { baseline: 'alphabetic' });

        doc.setTextColor(...this.brand.muted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Order Receipt', brandX, 26);

        // right-side order code + date
        doc.setTextColor(...this.brand.ink);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const rightX = pageWidth - margin.right;
        doc.text(`Order: ${d.orderCode}`, rightX, 16, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        const dateFmt = new Intl.DateTimeFormat('en-NG', {
          dateStyle: 'medium', timeStyle: 'short'
        }).format(d.date);
        doc.text(dateFmt, rightX, 22, { align: 'right' });

        // FOOTER
        doc.setDrawColor(...this.brand.border);
        doc.setLineWidth(0.3);
        doc.line(margin.left, pageHeight - margin.bottom + 4, pageWidth - margin.right, pageHeight - margin.bottom + 4);

        doc.setFontSize(9);
        doc.setTextColor(...this.brand.muted);
        doc.text('Thank you for shopping with GEOResinStore!', margin.left, pageHeight - 8);

        const pageCount = (doc as any).internal.getNumberOfPages?.() ?? doc.getNumberOfPages();
        const pageCurrent = doc.getCurrentPageInfo().pageNumber;
        doc.text(`Page ${pageCurrent} of ${pageCount}`, pageWidth - margin.right, pageHeight - 8, { align: 'right' });

        // WATERMARK (faint, behind content)
        // Draw it *before* main content on each page in didDrawPage
        if (logo) {
          const docAny = doc as any; // cast to access plugin / untyped methods
          docAny.saveGraphicsState?.();
          // alpha is supported via setGState in newer jsPDF versions; fallback: draw lightened PNG
          const wmW = 120;
          const wmH = (logo.height * wmW) / logo.width;
          const wmX = (pageWidth - wmW) / 2;
          const wmY = (pageHeight - wmH) / 2;

          // rotate around center
          docAny.rotate?.(330, { origin: [pageWidth / 2, pageHeight / 2] }); // -30 degrees
          // simulate opacity by drawing very faint
          docAny.setGState?.(docAny.GState({ opacity: 0.06 })) ?? doc.setTextColor(200, 200, 200);
          doc.addImage(logo, 'PNG', wmX, wmY, wmW, wmH, undefined, 'FAST');
          // reset rotation
          docAny.rotate?.(30, { origin: [pageWidth / 2, pageHeight / 2] }); // back
          docAny.restoreGraphicsState?.();
        }
      };

      // CUSTOMER + ORDER INFO BLOCK (above table)
      const infoBlock = () => {
        const startX = margin.left;
        let cursorY = margin.top;

        // Titles
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.brand.ink);
        doc.setFontSize(11);
        doc.text('Order Information', startX, cursorY);
        doc.text('Customer Details', pageWidth / 2, cursorY);

        cursorY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.brand.muted);
        doc.setFontSize(10);

        // Order column
        const colGap = 2.8;
        const orderLines = [
          ['Order Code:', data.orderCode],
          ['Date:', new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(data.date)],
          ['Time:', new Intl.DateTimeFormat('en-NG', { timeStyle: 'short' }).format(data.date)],
          ['Delivery:', data.deliveryLocation],
        ];
        orderLines.forEach((row, i) => {
          const y = cursorY + i * 6;
          doc.setFont('helvetica', 'bold');
          doc.text(row[0], startX, y);
          doc.setFont('helvetica', 'normal');
          doc.text(row[1], startX + 22 + colGap, y);
        });

        // Customer column
        const custLines = [
          ['Name:', data.customerName],
          ...(data.customerPhone ? [['Phone:', data.customerPhone]] : []),
          ...(data.customerEmail ? [['Email:', data.customerEmail]] : []),
          ...(data.customerWhatsapp ? [['WhatsApp:', data.customerWhatsapp]] : []),
        ];
        custLines.forEach((row, i) => {
          const y = cursorY + i * 6;
          doc.setFont('helvetica', 'bold');
          doc.text(row[0], pageWidth / 2, y);
          doc.setFont('helvetica', 'normal');
          doc.text(row[1], pageWidth / 2 + 20 + colGap, y);
        });

        // return the Y after the taller column
        const rowsCount = Math.max(orderLines.length, custLines.length);
        return cursorY + rowsCount * 6 + 6;
      };

      // Build table rows
      const rows = (data.items as AnyItem[]).map((item) => {
        const unit = this.parsePrice(item.unitPriceSnap ?? '0');
        const total = unit * (item.qty ?? 0);
        return [
          item.titleSnap ?? '',
          String(item.qty ?? 0),
          this.formatNGN(unit),
          this.formatNGN(total),
        ];
      });

      // Draw everything via autoTable so header/wm/foot repeat on page breaks
      let afterInfoY = 0;

      autoTable(doc, {
        // dummy first table just to render header/watermark/footer consistently
        head: [],
        body: [],
        margin: { left: margin.left, right: margin.right, top: margin.top, bottom: margin.bottom },
        didDrawPage: () => {
          renderHeaderFooter(data);
          if (!afterInfoY) {
            afterInfoY = infoBlock();
          }
        },
        // start below info
        startY: margin.top + 2,
        theme: 'plain',
      } as UserOptions);

      // ITEMS TABLE
      autoTable(doc, {
        head: [['Item', 'Qty', 'Unit Price', 'Total']],
        body: rows,
        startY: Math.max(afterInfoY, (doc as any).lastAutoTable?.finalY ?? margin.top + 8),
        margin: { left: margin.left, right: margin.right, bottom: margin.bottom },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          textColor: this.brand.ink as any,
          cellPadding: 3.2,
          lineColor: this.brand.border as any,
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [249, 250, 251],
          textColor: this.brand.ink as any,
          lineColor: this.brand.border as any,
          lineWidth: 0.4,
          halign: 'left',
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 18, halign: 'right' },
          2: { cellWidth: 34, halign: 'right' },
          3: { cellWidth: 34, halign: 'right' },
        },
        didDrawPage: () => {
          // ensure header/footer/watermark on every page of this table too
          renderHeaderFooter(data);
        },
      } as UserOptions);

      // TOTALS PANEL
      const y = Math.min(
        doc.internal.pageSize.getHeight() - margin.bottom - 40,
        ((doc as any).lastAutoTable?.finalY ?? margin.top) + 8
      );

      const boxX = pageWidth - margin.right - 80;
      const boxY = y;
      const boxW = 80;
      const boxH = 30;

      // Panel background
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(...this.brand.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(boxX, boxY, boxW, boxH, 2.5, 2.5, 'FD');

      const lineY = (row: number) => boxY + 7 + row * 8;

      // Subtotal
      doc.setTextColor(...this.brand.muted);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal', boxX + 4, lineY(0));
      doc.setTextColor(...this.brand.ink);
      doc.setFont('helvetica', 'bold');
      doc.text(this.formatNGN(data.subtotal), boxX + boxW - 4, lineY(0), { align: 'right' });

      // Delivery
      doc.setTextColor(...this.brand.muted);
      doc.setFont('helvetica', 'normal');
      doc.text('Delivery Fee', boxX + 4, lineY(1));
      doc.setTextColor(...this.brand.ink);
      doc.setFont('helvetica', 'bold');
      doc.text(this.formatNGN(data.deliveryFee), boxX + boxW - 4, lineY(1), { align: 'right' });

      // Divider
      doc.setDrawColor(...this.brand.border);
      doc.setLineWidth(0.3);
      doc.line(boxX + 4, lineY(1) + 2, boxX + boxW - 4, lineY(1) + 2);

      // Total
      doc.setTextColor(...this.brand.ink);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total', boxX + 4, lineY(2) + 6);
      doc.setTextColor(...this.brand.primary);
      doc.setFontSize(14);
      doc.text(this.formatNGN(data.total), boxX + boxW - 4, lineY(2) + 6, { align: 'right' });

      // Save
      doc.save(`receipt-${data.orderCode}.pdf`);
      toast.success('Receipt downloaded');
    } catch (err) {
      console.error('Receipt generation error:', err);
      toast.error('Receipt generation failed');
    }
  }

  /** Utils */

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private formatNGN(value: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      // Ensure symbol is the standard Naira sign
      .replace('NGN', '₦')
      .replace(/\s/g, '');
  }

  private parsePrice(val: any): number {
    if (val == null) return 0;
    let str = String(val).trim();
    if (!str) return 0;
    // Remove currency symbols & spaces
    str = str.replace(/[₦₵$€£¥]|NGN/gi, '').trim();
    // Remove thousands separators (., space, underscore) when used as grouping
    str = str.replace(/(?<=\d)[,\s_](?=\d{3}(\D|$))/g, '');
    // Keep only first decimal point
    const firstDot = str.indexOf('.');
    if (firstDot !== -1) {
      str = str.slice(0, firstDot + 1) + str.slice(firstDot + 1).replace(/\./g, '');
    }
    const num = parseFloat(str);
    return Number.isFinite(num) ? num : 0;
  }
}
