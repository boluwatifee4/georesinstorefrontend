import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { InvoiceDetails } from '../models/invoice.model';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private readonly document = inject(DOCUMENT);
  private readonly LOGO_URL = '/logo.png';

  async generateInvoicePDF(invoiceData: InvoiceDetails): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add watermark first
      try {
        await this.addWatermark(pdf);
      } catch (watermarkError) {
        console.warn('Failed to add watermark:', watermarkError);
      }

      // Generate invoice content using HTML template
      await this.addInvoiceContent(pdf, invoiceData);

      // Save the PDF
      pdf.save(`invoice-${invoiceData.invoiceNumber || 'draft'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  private async addInvoiceContent(
    pdf: jsPDF,
    invoice: InvoiceDetails,
  ): Promise<void> {
    const pageWidth = 210; // A4 width in mm
    const margin = 20;
    let yPosition = 30;

    // Set font
    pdf.setFont('helvetica');

    // Header - Company Info and Invoice Title
    pdf.setFontSize(24);
    pdf.setTextColor(59, 130, 246); // Blue color
    pdf.text('INVOICE', pageWidth - margin, yPosition, { align: 'right' });

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Your Company Name', margin, yPosition);
    pdf.text('123 Business Street', margin, yPosition + 5);
    pdf.text('Lagos, Nigeria', margin, yPosition + 10);
    pdf.text('Phone: +234 705 071 3289', margin, yPosition + 15);

    // Invoice Details
    yPosition += 25;
    pdf.setFontSize(10);
    pdf.text(
      `Invoice #: ${invoice.invoiceNumber || 'Not Set'}`,
      pageWidth - margin,
      yPosition,
      { align: 'right' },
    );
    pdf.text(
      `Date: ${this.formatDate(invoice.date)}`,
      pageWidth - margin,
      yPosition + 5,
      { align: 'right' },
    );
    pdf.text(
      `Due Date: ${this.formatDate(invoice.dueDate)}`,
      pageWidth - margin,
      yPosition + 10,
      { align: 'right' },
    );

    // Bill To Section
    yPosition += 25;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', margin, yPosition);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(invoice.customerName || 'Customer Name', margin, yPosition + 8);

    if (invoice.customerEmail) {
      pdf.text(invoice.customerEmail, margin, yPosition + 16);
      yPosition += 8;
    }

    if (invoice.customerAddress) {
      const addressLines = invoice.customerAddress.split('\n');
      addressLines.forEach((line, index) => {
        pdf.text(line, margin, yPosition + 16 + index * 5);
      });
      yPosition += addressLines.length * 5;
    }

    // Items Table
    yPosition += 25;

    // Table headers
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);

    const tableTop = yPosition;
    const descCol = margin;
    const qtyCol = 120;
    const priceCol = 145;
    const amountCol = 170;

    // Draw header background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, 8, 'F');

    // Header text
    pdf.text('Description', descCol + 2, tableTop + 5);
    pdf.text('Qty', qtyCol + 2, tableTop + 5);
    pdf.text('Price', priceCol + 2, tableTop + 5);
    pdf.text('Amount', amountCol + 2, tableTop + 5);

    // Draw header border
    pdf.setLineWidth(0.5);
    pdf.line(margin, tableTop + 8, pageWidth - margin, tableTop + 8);

    yPosition += 12;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    invoice.items?.forEach((item, index) => {
      const amount = (item.quantity || 0) * (item.price || 0);

      pdf.text(item.description || '', descCol + 2, yPosition);
      pdf.text((item.quantity || 0).toString(), qtyCol + 2, yPosition);
      pdf.text(
        `₦${(item.price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        priceCol + 2,
        yPosition,
      );
      pdf.text(
        `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        amountCol + 2,
        yPosition,
      );

      yPosition += 8;

      // Draw row separator
      if (index < invoice.items.length - 1) {
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      }
    });

    // Final table border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);

    // Totals Section
    yPosition += 15;
    const totalsX = pageWidth - 80;

    // Subtotal
    pdf.text('Subtotal:', totalsX, yPosition);
    pdf.text(
      `₦${(invoice.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      totalsX + 30,
      yPosition,
    );

    // Delivery Cost (if applicable)
    if (invoice.deliveryCost && invoice.deliveryCost > 0) {
      yPosition += 8;
      pdf.text('Delivery Cost:', totalsX, yPosition);
      pdf.text(
        `₦${invoice.deliveryCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        totalsX + 30,
        yPosition,
      );
    }

    // Total
    yPosition += 8;
    pdf.setLineWidth(1);
    pdf.line(totalsX, yPosition - 2, pageWidth - margin, yPosition - 2);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246); // Blue color
    pdf.text('Total:', totalsX, yPosition + 5);
    pdf.text(
      `₦${(invoice.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      totalsX + 30,
      yPosition + 5,
    );

    // Notes (if any)
    if (invoice.notes) {
      yPosition += 25;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Notes:', margin, yPosition);

      pdf.setFont('helvetica', 'normal');
      const noteLines = invoice.notes.split('\n');
      noteLines.forEach((line, index) => {
        pdf.text(line, margin, yPosition + 8 + index * 5);
      });
    }

    // Footer
    const footerY = 280;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Thank you for your business!', pageWidth / 2, footerY, {
      align: 'center',
    });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB');
  }

  private async addWatermark(pdf: jsPDF): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.LOGO_URL;

      img.onload = () => {
        try {
          const canvas = this.document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve();
            return;
          }

          // Set canvas size to match A4 dimensions at high resolution for crisp output
          canvas.width = 2480; // A4 at 300 DPI (210mm * 300/25.4)
          canvas.height = 3508; // A4 at 300 DPI (297mm * 300/25.4)

          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Logo settings for watermark pattern
          const logoWidth = 120; // Smaller size for subtle watermark
          const logoHeight = (img.height * logoWidth) / img.width;
          const spacing = 40; // Space between logos
          const patternWidth = logoWidth + spacing;
          const patternHeight = logoHeight + spacing;

          // Set very light opacity for watermark effect
          ctx.globalAlpha = 0.06;

          // Save context for rotation
          ctx.save();

          // Move to center for rotation
          ctx.translate(canvas.width / 2, canvas.height / 2);

          // Rotate the entire pattern by -30 degrees for diagonal watermark
          ctx.rotate((-30 * Math.PI) / 180);

          // Calculate how many logos we need to cover the rotated canvas
          const diagonal = Math.sqrt(
            canvas.width * canvas.width + canvas.height * canvas.height,
          );
          const cols = Math.ceil(diagonal / patternWidth) + 2;
          const rows = Math.ceil(diagonal / patternHeight) + 2;

          // Draw repeating logo pattern from center outward
          for (let row = -rows; row <= rows; row++) {
            for (let col = -cols; col <= cols; col++) {
              const x = col * patternWidth - logoWidth / 2;
              const y = row * patternHeight - logoHeight / 2;

              // Draw the logo
              ctx.drawImage(img, x, y, logoWidth, logoHeight);
            }
          }

          // Restore context (undo rotation and translation)
          ctx.restore();

          // Convert canvas to image data
          const imgData = canvas.toDataURL('image/png', 1.0);

          // Add the watermark background to PDF (layer 0 - behind everything)
          pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, 'watermark-bg', 'NONE');

          resolve();
        } catch (error) {
          console.warn('Watermark creation error:', error);
          resolve(); // Continue without watermark
        }
      };

      img.onerror = () => {
        console.warn('Failed to load watermark logo from:', this.LOGO_URL);
        resolve(); // Continue without watermark
      };
    });
  }
}
