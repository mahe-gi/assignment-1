/**
 * Normalizes a date string or Date object to UTC midnight (00:00:00.000Z).
 * @param {string|Date} dateInput 
 * @returns {Date} Normalized Date object
 */
const normalizeToUTCMidnight = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Calculates inclusive calendar days between two dates.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number} Inclusive days
 */
const calculateInclusiveDays = (startDate, endDate) => {
  const start = normalizeToUTCMidnight(startDate);
  const end = normalizeToUTCMidnight(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

module.exports = {
  normalizeToUTCMidnight,
  calculateInclusiveDays
};
