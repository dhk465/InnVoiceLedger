// backend/utils/calculationHelpers.js

/**
 * Calculates the number of *nights* between two Date objects.
 * Assumes check-out day doesn't count as a night.
 * e.g., check-in Mon, check-out Tue = 1 night.
 * e.g., check-in Mon, check-out Wed = 2 nights.
 * @param {Date} startDate The start date object.
 * @param {Date} endDate The end date object.
 * @returns {number | null} Number of nights, or null if dates are invalid/end is not after start.
 */
const calculateNightsBetween = (startDate, endDate) => {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
        return null; // Invalid input
    }
    // Clone dates and clear time part for accurate day difference
    const start = new Date(startDate.getTime());
    const end = new Date(endDate.getTime());
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Difference in days
    return diffDays > 0 ? diffDays : null; // Return days difference, ensure it's positive
};

/**
 * Calculates the number of *days* (inclusive) between two Date objects.
 * e.g., start Mon, end Tue = 2 days.
 * e.g., start Mon, end Mon = 1 day.
 * @param {Date} startDate The start date object.
 * @param {Date} endDate The end date object.
 * @returns {number | null} Number of days, or null if dates are invalid/end is before start.
 */
const calculateDaysInclusive = (startDate, endDate) => {
     if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
        return null; // Invalid input
    }
    // Clone dates and clear time part
    const start = new Date(startDate.getTime());
    const end = new Date(endDate.getTime());
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Add 1 because the period is inclusive
};


module.exports = {
    calculateNightsBetween,
    calculateDaysInclusive,
};