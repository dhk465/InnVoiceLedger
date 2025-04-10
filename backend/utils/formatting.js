// backend/utils/formatting.js

// Basic currency formatter (doesn't rely on browser Intl)
// You might use a more robust library like 'dinero.js' for backend money handling
const formatCurrency = (amount, currencyCode) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || typeof currencyCode !== 'string' || currencyCode.length !== 3) {
        return `${amount || '-'} ${currencyCode || ''}`.trim();
    }
    // Basic formatting, doesn't handle locale-specific symbols well, but okay for PDF
    return `${numAmount.toFixed(2)} ${currencyCode}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        // Format as YYYY-MM-DD
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
        if (isNaN(date.getTime())) return dateString; // Invalid date check
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateString;
    }
};

module.exports = {
    formatCurrency,
    formatDate,
};