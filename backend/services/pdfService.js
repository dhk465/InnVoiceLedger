// backend/services/pdfService.js
const PDFDocument = require('pdfkit');
// Use backend formatting utils
const { formatCurrency, formatDate } = require('../utils/formatting');

// Helper to safely get potentially nested properties
const getSafe = (fn, defaultValue = '') => {
    try { return fn() ?? defaultValue; } // Use nullish coalescing for undefined/null
    catch (e) { return defaultValue; }
};

// --- PDF Generation Logic ---
function buildInvoicePDF(invoiceData, stream) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Pipe output to the stream (e.g., HTTP response)
    doc.pipe(stream);

    // --- Helper Variables ---
    const customer = invoiceData.customer || {};
    const items = invoiceData.invoiceItems || [];
    const invoiceCurrency = invoiceData.currency || 'N/A'; // Get invoice currency
    // Colors
    const baseColor = '#333333';
    const accentColor = '#0056b3';
    const lightGrayColor = '#888888';
    const tableHeaderColor = '#F1F3F5';

    // --- Document Header ---
    doc.fontSize(22).fillColor(accentColor).text('INVOICE', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(baseColor).text(`Invoice #: ${invoiceData.invoiceNumber || 'N/A'}`, { align: 'right' });
    doc.text(`Issue Date: ${formatDate(invoiceData.issueDate)}`, { align: 'right' });
    doc.text(`Due Date: ${formatDate(invoiceData.dueDate)}`, { align: 'right' });

    // --- Business Details (Placeholder - Use invoiceData.businessDetailsSnapshot later) ---
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor(accentColor).text('Your Business Name Placeholder', { continued: false });
    doc.fontSize(10).fillColor(lightGrayColor).text('123 Your Street');
    doc.text('Your City, YPC 123');
    doc.text('Your Country');
    doc.text('VAT ID: YOUR_VAT_ID_HERE');
    doc.text('Email: contact@yourbusiness.com');
    doc.text('Phone: +XX XXX XXX XXX');

    // --- Bill To Section ---
    const billToY = doc.y;
    const billToX = 300; // Start further right
    doc.fontSize(12).fillColor(accentColor).text('Bill To:', billToX, billToY - 22, { continued: false });
    doc.fontSize(10).fillColor(baseColor);
    doc.text(getSafe(() => customer.name), billToX);
    if (customer.companyName) doc.text(customer.companyName, billToX);
    // Handle potential line breaks in address safely
    if (customer.address) doc.text(getSafe(() => customer.address.replace(/\r\n/g, '\n')), billToX);
    if (customer.vatId) doc.text(`VAT ID: ${customer.vatId}`, billToX);
    if (customer.email) doc.text(`Email: ${customer.email}`, billToX);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`, billToX);


    doc.moveDown(3); // Space before table

    // --- Line Items Table ---
    const tableTopY = doc.y;
    // Define column starting X positions
    const itemColX = 50;        // Start of Item Description
    const qtyColX = 280;        // Start of Quantity
    const unitColX = 320;       // Start of Unit
    const unitPriceColX = 370;  // Start of Unit Price (Converted)
    const totalColX = 470;      // Start of Line Total (Converted)
    const tableEndX = totalColX + 80; // End X position for lines/rects

    const rowHeight = 20; // Base row height
    const headerPadding = 5; // Padding inside header cells
    const cellPadding = 5;   // Padding inside data cells

    // Draw Table Header Background
    doc.rect(itemColX - cellPadding, tableTopY, tableEndX - (itemColX - cellPadding), rowHeight).fill(tableHeaderColor);

    // Draw Table Header Text
    doc.fontSize(9).fillColor(baseColor).font('Helvetica-Bold');
    doc.text('Item / Description', itemColX, tableTopY + headerPadding);
    doc.text('Qty', qtyColX, tableTopY + headerPadding, { width: unitColX - qtyColX - cellPadding, align: 'right' });
    doc.text('Unit', unitColX, tableTopY + headerPadding, { width: unitPriceColX - unitColX - cellPadding, align: 'left' });
    // --- UPDATED: Added Unit Price Header ---
    doc.text(`Unit Price (${invoiceCurrency})`, unitPriceColX, tableTopY + headerPadding, { width: totalColX - unitPriceColX - cellPadding, align: 'right' });
    // --- END UPDATE ---
    doc.text(`Total (${invoiceCurrency})`, totalColX, tableTopY + headerPadding, { width: tableEndX - totalColX - cellPadding, align: 'right' });
    doc.font('Helvetica'); // Reset font


    // Table Rows
    let currentY = tableTopY + rowHeight; // Start Y position for first row content
    items.forEach((item, index) => {
        // Determine maximum height needed for this row (based on description)
        const descWidth = qtyColX - itemColX - cellPadding;
        const descHeight = doc.heightOfString(item.description, { width: descWidth });
        // Add extra height for conversion details if needed
        const conversionText = (item.originalCurrency && item.originalCurrency !== invoiceCurrency)
            ? `(Orig: ${formatCurrency(item.originalUnitPriceWithoutVAT, item.originalCurrency)} @ ${parseFloat(item.exchangeRateUsed || 0).toFixed(4)})`
            : '';
        const conversionHeight = conversionText ? doc.heightOfString(conversionText, { width: descWidth, fontSize: 7 }) + 2 : 0;
        const currentRowHeight = Math.max(rowHeight, descHeight + conversionHeight + (cellPadding * 2)); // Ensure minimum height + padding

        // --- Page Break Logic ---
        if (currentY + currentRowHeight > doc.page.height - doc.page.margins.bottom - 50) { // Check if row fits before drawing
            doc.addPage();
            currentY = doc.page.margins.top; // Reset Y
            // Optionally redraw headers on new page
            doc.rect(itemColX - cellPadding, currentY, tableEndX - (itemColX - cellPadding), rowHeight).fill(tableHeaderColor);
            doc.fontSize(9).fillColor(baseColor).font('Helvetica-Bold');
            doc.text('Item / Description', itemColX, currentY + headerPadding); // Re-draw headers
            doc.text('Qty', qtyColX, currentY + headerPadding, { width: unitColX - qtyColX - cellPadding, align: 'right' });
            doc.text('Unit', unitColX, currentY + headerPadding, { width: unitPriceColX - unitColX - cellPadding, align: 'left' });
            doc.text(`Unit Price (${invoiceCurrency})`, unitPriceColX, currentY + headerPadding, { width: totalColX - unitPriceColX - cellPadding, align: 'right' });
            doc.text(`Total (${invoiceCurrency})`, totalColX, currentY + headerPadding, { width: tableEndX - totalColX - cellPadding, align: 'right' });
            doc.font('Helvetica');
            currentY += rowHeight; // Advance Y after header
        }
        // --- End Page Break Logic ---

        // Draw row background/borders (optional - or just horizontal lines)
        doc.moveTo(itemColX - cellPadding, currentY).lineTo(tableEndX, currentY).lineWidth(0.5).strokeColor('#DDDDDD').stroke(); // Top line

        // Draw Cell Content
        doc.fillColor(baseColor).fontSize(9);
        const textY = currentY + cellPadding; // Y position for text inside row

        // Description
        doc.text(item.description, itemColX, textY, { width: descWidth });
        // Display conversion details below description if applicable
        if (conversionText) {
            doc.fontSize(7).fillColor(lightGrayColor).text(conversionText, itemColX, textY + descHeight + 2, { width: descWidth });
        }

        // Quantity
        doc.text(item.quantity, qtyColX, textY, { width: unitColX - qtyColX - cellPadding, align: 'right' });
        // Unit
        doc.text(item.unit, unitColX, textY, { width: unitPriceColX - unitColX - cellPadding, align: 'left' });
        // --- UPDATED: Add Converted Unit Price Column ---
        doc.text(formatCurrency(item.unitPriceWithoutVAT, invoiceCurrency), unitPriceColX, textY, { width: totalColX - unitPriceColX - cellPadding, align: 'right' });
        // --- END UPDATE ---
        // Line Total (Converted)
        doc.text(formatCurrency(item.lineTotalWithVAT, invoiceCurrency), totalColX, textY, { width: tableEndX - totalColX - cellPadding, align: 'right' });


        // Advance Y position for the next row
        currentY += currentRowHeight;
    });
    // Draw final bottom line for the table
    doc.moveTo(itemColX - cellPadding, currentY).lineTo(tableEndX, currentY).lineWidth(0.5).strokeColor('#DDDDDD').stroke();


    // --- Totals Section ---
    // Position totals below the table, aligned right
    const totalsStartY = currentY + 20; // Add some space after the table
    const labelX = totalColX - 100; // X position for labels like "Subtotal:"
    const valueX = totalColX; // X position for the amounts
    const totalsWidth = tableEndX - labelX; // Width for alignment

    doc.fontSize(10).font('Helvetica');
    doc.text('Subtotal (excl. VAT):', labelX, totalsStartY, { width: 100, align: 'right' });
    doc.text(formatCurrency(invoiceData.subtotalWithoutVAT, invoiceCurrency), valueX, totalsStartY, { width: tableEndX - valueX - cellPadding, align: 'right' });

    doc.text('Total VAT:', labelX, totalsStartY + 15, { width: 100, align: 'right' });
    doc.text(formatCurrency(invoiceData.totalVATAmount, invoiceCurrency), valueX, totalsStartY + 15, { width: tableEndX - valueX - cellPadding, align: 'right' });

    doc.moveDown(0.5); // Add slight space

    // Grand Total - Bolder
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Grand Total:', labelX, totalsStartY + 35, { width: 100, align: 'right' });
    doc.text(formatCurrency(invoiceData.grandTotal, invoiceCurrency), valueX, totalsStartY + 35, { width: tableEndX - valueX - cellPadding, align: 'right' });

    doc.font('Helvetica'); // Reset font


    // --- Notes Section ---
    if (invoiceData.notes) {
        // Position notes potentially below totals or wherever makes sense
        doc.moveDown(2);
        const notesY = doc.y;
        doc.fontSize(10).fillColor(baseColor).text('Notes:', 50, notesY);
        doc.fillColor(lightGrayColor).text(invoiceData.notes, 50, notesY + 15, { // Indent note content slightly
            width: doc.page.width - 100 // Use available width
        });
    }

    // --- Footer (Optional) ---
    doc.fontSize(8).fillColor(lightGrayColor)
        .text('Thank you for your business!', 50, doc.page.height - 30, { align: 'center', width: doc.page.width - 100 });


    // Finalize the PDF document - triggers piping to the stream
    doc.end();
}

// Export the builder function
module.exports = { buildInvoicePDF };