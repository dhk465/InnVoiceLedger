// src/utils/formatting.js

/**
 * Formats a number as currency according to Intl standards.
 * @param {number|string|null|undefined} amount - The numerical amount.
 * @param {string|null|undefined} currencyCode - The 3-letter ISO currency code.
 * @param {string} locale - Optional locale string (e.g., 'cs-CZ', 'en-US'), defaults to 'en'.
 * @returns {string} - Formatted currency string or fallback.
 */
export const formatCurrency = (amount, currencyCode, locale = 'en') => {
    const numAmount = parseFloat(amount);
    // Basic validation for amount and currency code
    if (isNaN(numAmount) || typeof currencyCode !== 'string' || currencyCode.length !== 3) {
        const rawAmount = amount != null ? String(amount) : '-';
        const rawCurrency = currencyCode != null ? String(currencyCode) : '';
        // Simple fallback if inputs are bad
        return `${rawAmount} ${rawCurrency}`.trim();
    }

    try {
        // Use Intl.NumberFormat for proper localization
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2, // Standard for most currencies
            maximumFractionDigits: 2,
        }).format(numAmount);
    } catch (e) {
        // Fallback if Intl doesn't support the currency code or locale
        console.warn(`Could not format currency ${currencyCode} with locale ${locale}:`, e);
        // Provide a basic fallback format
        return `${numAmount.toFixed(2)} ${currencyCode}`;
    }
};

/**
 * Formats a date string (YYYY-MM-DD or full ISO) into a locale-specific short date.
 * @param {string|null|undefined} dateString - The date string to format.
 * @param {string} locale - Optional locale string, defaults to undefined (browser default).
 * @returns {string} - Formatted date string or fallback.
 */
export const formatDate = (dateString, locale = undefined) => {
    if (!dateString) return '-';
    try {
        // Add time part if only date is provided, assume UTC to avoid timezone shifts during parsing
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short', // Or '2-digit'
            day: 'numeric',
            timeZone: 'UTC' // Display date based on UTC input, prevents off-by-one day issues
        });
    } catch (e) {
        console.warn(`Could not format date ${dateString}:`, e);
        return dateString; // Fallback to original string
    }
};

// Add other formatting functions here (datetime, numbers, etc.)