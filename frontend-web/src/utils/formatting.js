// src/utils/formatting.js

/**
 * Formats a number as currency according to Intl standards.
 * @param {number|string|null|undefined} amount
 * @param {string|null|undefined} currencyCode - 3-letter ISO code.
 * @param {string} [localeCode='en-US'] - BCP 47 locale code (e.g., 'cs-CZ', 'ko-KR').
 * @returns {string} - Formatted currency string or fallback.
 */
export const formatCurrency = (amount, currencyCode, localeCode = 'en-US') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || typeof currencyCode !== 'string' || currencyCode.length !== 3) {
        const rawAmount = amount != null ? String(amount) : '-';
        const rawCurrency = currencyCode != null ? String(currencyCode) : '';
        return `${rawAmount} ${rawCurrency}`.trim();
    }
    try {
        // Use provided localeCode
        return new Intl.NumberFormat(localeCode, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);
    } catch (e) {
        console.warn(`Could not format currency ${currencyCode} with locale ${localeCode}:`, e);
        return `${numAmount.toFixed(2)} ${currencyCode}`; // Fallback
    }
};

/**
 * Formats a date string into a locale-specific short date.
 * @param {string|null|undefined} dateString - YYYY-MM-DD or ISO string.
 * @param {string} [localeCode=undefined] - BCP 47 locale code, uses browser default if undefined.
 * @returns {string} - Formatted date string or fallback.
 */
export const formatDate = (dateString, localeCode = undefined) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
         if (isNaN(date.getTime())) throw new Error("Invalid Date");
        // Use provided localeCode
        return date.toLocaleDateString(localeCode, {
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
        });
    } catch (e) {
        console.warn(`Could not format date ${dateString} with locale ${localeCode}:`, e);
        return dateString;
    }
};

/**
 * Formats a date string into a locale-specific short date and time.
 * @param {string|null|undefined} dateString - ISO string preferred.
 * @param {string} [localeCode=undefined] - BCP 47 locale code.
 * @returns {string} - Formatted datetime string or fallback.
 */
export const formatDateTime = (dateString, localeCode = undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
       if (isNaN(date.getTime())) throw new Error("Invalid Date");
      // Use provided localeCode
      return date.toLocaleString(localeCode, { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        console.warn(`Could not format datetime string "${dateString}" with locale ${localeCode}:`, e);
        return dateString; // Fallback
    }
};