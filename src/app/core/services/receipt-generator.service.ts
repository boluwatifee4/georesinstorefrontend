import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

@Injectable({ providedIn: 'root' })
export class ReceiptGeneratorService {

  generateReceipt(data: ReceiptData): void {
    try {
      // Create a temporary div for the receipt
      const receiptElement = this.createReceiptElement(data);
      document.body.appendChild(receiptElement);

      // Apply watermark background (tiled logo) before rendering
      this.applyWatermark(receiptElement, '/logo.png')
        .catch(err => { console.warn('Watermark failed:', err); });

      // Use html2canvas to convert to image, then jsPDF to create PDF
      html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Download the PDF
        pdf.save(`receipt-${data.orderCode}.pdf`);

        // Clean up
        document.body.removeChild(receiptElement);
      }).catch(error => {
        console.error('Error generating receipt:', error);
        document.body.removeChild(receiptElement);
        toast.error('Receipt generation failed');
      });
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Receipt generation failed');
    }
  }

  private async applyWatermark(container: HTMLElement, logoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            // Create a small pattern canvas
            const tileWidth = 220; // adjust spacing horizontally
            const tileHeight = 160; // adjust spacing vertically
            const canvas = document.createElement('canvas');
            canvas.width = tileWidth;
            canvas.height = tileHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(undefined); return; }

            // Clear & set transparency
            ctx.clearRect(0, 0, tileWidth, tileHeight);

            const targetLogoWidth = 140; // scale logo within tile
            const aspect = img.width / img.height || 1;
            const w = targetLogoWidth;
            const h = w / aspect;
            const x = (tileWidth - w) / 2;
            const y = (tileHeight - h) / 2;

            ctx.globalAlpha = 0.06; // very light so content readable
            ctx.drawImage(img, x, y, w, h);
            ctx.globalAlpha = 1;

            const dataUrl = canvas.toDataURL('image/png');

            // Apply as repeating background
            container.style.backgroundImage = `url(${dataUrl})`;
            container.style.backgroundRepeat = 'repeat';
            container.style.backgroundPosition = '0 0';
            container.style.backgroundSize = `${tileWidth}px ${tileHeight}px`;
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = logoUrl;
      } catch (err) {
        reject(err);
      }
    });
  }

  private createReceiptElement(data: ReceiptData): HTMLElement {
    const div = document.createElement('div');
    // make watermark background
    div.style.background = 'url(/logo.png) repeat center';
    div.style.backgroundSize = 'contain';
    div.style.opacity = '0.1';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '-1';
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '-9999px';
    div.style.width = '800px';
    div.style.padding = '40px';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.background = 'white';
    div.style.color = 'black';

    div.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto; padding: 40px; border: 2px solid #e5e7eb; border-radius: 12px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px;">
            <img src="/logo.png" alt="GEOResinStore Logo" style="height: 64px; width: 64px; object-fit: contain;" />
            <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 0.5px;">GEOResinStore</h1>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 18px;">Order Receipt</p>
        </div>

        <!-- Order Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: #374151;">Order Information</h3>
            <div style="line-height: 1.8; color: #6b7280;">
              <div><strong>Order Code:</strong> ${data.orderCode}</div>
              <div><strong>Date:</strong> ${data.date.toLocaleDateString('en-NG')}</div>
              <div><strong>Time:</strong> ${data.date.toLocaleTimeString('en-NG')}</div>
            </div>
          </div>

          <div>
            <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: #374151;">Customer Details</h3>
            <div style="line-height: 1.8; color: #6b7280;">
              <div><strong>Name:</strong> ${data.customerName}</div>
              ${data.customerPhone ? `<div><strong>Phone:</strong> ${data.customerPhone}</div>` : ''}
              ${data.customerEmail ? `<div><strong>Email:</strong> ${data.customerEmail}</div>` : ''}
              ${data.customerWhatsapp ? `<div><strong>WhatsApp:</strong> ${data.customerWhatsapp}</div>` : ''}
              <div><strong>Delivery:</strong> ${data.deliveryLocation}</div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #374151;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Item</th>
                <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Qty</th>
                <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Unit Price</th>
                <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => {
      const unitPrice = this.parsePrice((item as any).unitPriceSnap || '0');
      const total = unitPrice * item.qty;
      return `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; color: #374151;">${item.titleSnap}</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">${item.qty}</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">₦${unitPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">₦${total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="margin-bottom: 40px; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="color: #374151; font-weight: bold;">₦${data.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Delivery Fee:</span>
            <span style="color: #374151; font-weight: bold;">₦${data.deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #d1d5db;">
            <span style="color: #374151; font-size: 20px; font-weight: bold;">Total:</span>
            <span style="color: #6366f1; font-size: 24px; font-weight: bold;">₦${data.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p style="margin: 0 0 8px 0;"><strong>Thank you for shopping with Georesin Store!</strong></p>
          <p style="margin: 0;">For inquiries, please contact us with your order code: ${data.orderCode}</p>
        </div>
      </div>
    `;

    return div;
  }

  private parsePrice(val: any): number {
    if (val == null) return 0;
    let str = String(val).trim();
    if (!str) return 0;
    // Remove currency symbols & spaces
    str = str.replace(/[₦$€£¥]/g, '').trim();
    // Remove thousands separators
    str = str.replace(/[,\s_](?=\d{3}(\D|$))/g, '');
    // Keep only first decimal point
    const firstDot = str.indexOf('.');
    if (firstDot !== -1) {
      str = str.slice(0, firstDot + 1) + str.slice(firstDot + 1).replace(/\./g, '');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }
}
