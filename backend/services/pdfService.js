// backend/services/pdfService.js
const PDFDocument = require('pdfkit');
const { formatCurrency, formatDate } = require('../utils/formatting'); // Assuming backend utils

// Helper to safely get nested properties
const getSafe = (fn, defaultValue = '') => {
    try { return fn() ?? defaultValue; } // Use nullish coalescing
    catch (e) { return defaultValue; }
};

// --- PDF Generation Logic ---
function buildInvoicePDF(invoiceData, stream) { // Accept invoice data and writeable stream
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50 // Margins in points (72 points = 1 inch)
    });

    // Pipe the PDF output to the provided stream (e.g., HTTP response)
    doc.pipe(stream);

    // --- Helper Variables ---
    const customer = invoiceData.customer || {}; // Handle missing customer data gracefully
    const items = invoiceData.invoiceItems || [];
    const baseColor = '#333333'; // Dark gray for text
    const accentColor = '#0056b3'; // Darker blue for headers/accents
    const lightGrayColor = '#888888';
    const tableHeaderColor = '#F1F3F5'; // Light gray background

    // --- Document Header ---
    doc.fontSize(22).fillColor(accentColor).text('INVOICE', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(baseColor).text(`Invoice #: ${invoiceData.invoiceNumber}`, { align: 'right' });
    doc.text(`Issue Date: ${formatDate(invoiceData.issueDate)}`, { align: 'right' });
    doc.text(`Due Date: ${formatDate(invoiceData.dueDate)}`, { align: 'right' });

    // --- Business Details (Later from Settings Snapshot) ---
    // Placeholder - Replace with actual snapshot data later
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor(accentColor).text('Your Business Name', { continued: false }); // Reset continued state
    doc.fontSize(10).fillColor(lightGrayColor).text('Your Street Address');
    doc.text('Your City, Post Code');
    doc.text('Your Country');
    doc.text('VAT ID: YOUR_VAT_ID'); // Replace with actual VAT ID
    doc.text('Email: your.email@example.com');
    doc.text('Phone: +12 345 678 90');

    // --- Bill To Section ---
    const billToY = doc.y; // Save Y position to align horizontally later if needed
    const billToX = 300; // Start Bill To further right
    doc.fontSize(12).fillColor(accentColor).text('Bill To:', billToX, billToY - 22, { continued: false }); // Position title
    doc.fontSize(10).fillColor(baseColor);
    doc.text(getSafe(() => customer.name), billToX);
    if (customer.companyName) doc.text(customer.companyName, billToX);
    if (customer.address) doc.text(getSafe(() => customer.address.replace(/\r\n/g, '\n')), billToX); // Handle line breaks
    if (customer.vatId) doc.text(`VAT ID: ${customer.vatId}`, billToX);
    if (customer.email) doc.text(`Email: ${customer.email}`, billToX);

    doc.moveDown(3); // Space before table

    // --- Line Items Table ---
    const tableTopY = doc.y;
    const itemColX = 50;
    const qtyColX = 300;
    const unitPriceColX = 350;
    const totalColX = 450; // Adjust positions as needed
    const rowHeight = 25; // Approximate height per row

    // Table Header
    doc.fontSize(10).fillColor(baseColor);
    doc.rect(itemColX - 10, tableTopY, (totalColX + 100) - (itemColX - 10), rowHeight).fill(tableHeaderColor);
    doc.fillColor(baseColor).font('Helvetica-Bold'); // Bold headers
    doc.text('Item / Description', itemColX, tableTopY + 7); // Adjust Y offset for vertical centering
    doc.text('Qty', qtyColX, tableTopY + 7, { width: 40, align: 'right' });
    doc.text('Unit Price', unitPriceColX, tableTopY + 7, { width: 80, align: 'right' });
    doc.text('Total', totalColX, tableTopY + 7, { width: 90, align: 'right' });
    doc.font('Helvetica'); // Reset font

    // Table Rows
    let currentY = tableTopY + rowHeight;
    items.forEach((item, index) => {
        // Draw line separator (optional)
        doc.moveTo(itemColX - 10, currentY).lineTo(totalColX + 100, currentY).lineWidth(0.5).strokeColor('#DDDDDD').stroke();

        doc.fillColor(baseColor).fontSize(9); // Smaller font for items
        // Description (handle potential line breaks)
        const descHeight = doc.heightOfString(item.description, { width: qtyColX - itemColX - 10 });
        doc.text(item.description, itemColX, currentY + 7, { width: qtyColX - itemColX - 10 });

        // Other columns
        doc.text(item.quantity, qtyColX, currentY + 7, { width: 40, align: 'right' });
        // Show converted unit price
        doc.text(formatCurrency(item.unitPriceWithoutVAT, invoiceData.currency), unitPriceColX, currentY + 7, { width: 80, align: 'right' });
        // Show final line total
        doc.text(formatCurrency(item.lineTotalWithVAT, invoiceData.currency), totalColX, currentY + 7, { width: 90, align: 'right' });

        // Add details about original currency/rate below description if needed
        if (item.originalCurrency && item.originalCurrency !== invoiceData.currency) {
             doc.fontSize(7).fillColor(lightGrayColor).text(
                `(Orig: ${formatCurrency(item.originalUnitPriceWithoutVAT, item.originalCurrency)}/unit @ ${parseFloat(item.exchangeRateUsed).toFixed(4)})`,
                itemColX, currentY + 7 + descHeight + 2 , // Position below description
                { width: qtyColX - itemColX - 10, lineBreak: false }
             );
        }

        // Calculate dynamic row height based on description and extra details
        const detailsHeight = (item.originalCurrency && item.originalCurrency !== invoiceData.currency) ? 12 : 0;
        currentY += Math.max(rowHeight - 10, descHeight + detailsHeight) + 10; // Ensure minimum height and add padding

        // --- Page Break Logic (Basic) ---
        // Estimate if next row fits, if not, add new page
        // A more robust solution involves measuring precisely or using libraries
        if (currentY > doc.page.height - doc.page.margins.bottom - 50) { // If near bottom margin
            doc.addPage();
            currentY = doc.page.margins.top; // Reset Y to top margin
            // Redraw headers on new page if desired (optional)
        }
    });
     // Draw final bottom line
    doc.moveTo(itemColX - 10, currentY).lineTo(totalColX + 100, currentY).lineWidth(0.5).strokeColor('#DDDDDD').stroke();


    // --- Totals Section ---
    const totalsY = currentY + 20;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Subtotal (excl. VAT):', totalColX - 100, totalsY, { width: 100, align: 'right' });
    doc.font('Helvetica').text(formatCurrency(invoiceData.subtotalWithoutVAT, invoiceData.currency), totalColX, totalsY, { width: 90, align: 'right' });

    doc.font('Helvetica-Bold').text('Total VAT:', totalColX - 100, totalsY + 15, { width: 100, align: 'right' });
    doc.font('Helvetica').text(formatCurrency(invoiceData.totalVATAmount, invoiceData.currency), totalColX, totalsY + 15, { width: 90, align: 'right' });

    doc.moveDown(0.5); // Add slight space

    doc.font('Helvetica-Bold').fontSize(11).text('Grand Total:', totalColX - 100, totalsY + 35, { width: 100, align: 'right' });
    doc.font('Helvetica-Bold').text(formatCurrency(invoiceData.grandTotal, invoiceData.currency), totalColX, totalsY + 35, { width: 90, align: 'right' });

    doc.font('Helvetica'); // Reset font

    // --- Notes Section ---
    if (invoiceData.notes) {
        doc.moveDown(2);
        doc.fontSize(10).text('Notes:', 50, doc.y);
        doc.fillColor(lightGrayColor).text(invoiceData.notes, { indent: 10 });
    }

    // --- Footer (Optional) ---
    // doc.fontSize(8).fillColor(lightGrayColor)
    //     .text('Thank you for your business!', 50, doc.page.height - 30, { align: 'center', width: doc.page.width - 100 });


    // Finalize the PDF document
    doc.end();
}

module.exports = { buildInvoicePDF };