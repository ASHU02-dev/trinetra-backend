// services/dasha.js
// Vimshottari Dasha - the most widely used dasha system in Vedic astrology.
// Based on which Nakshatra (of 27) the Moon occupies at birth, and how far
// through that nakshatra the Moon has travelled.

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// Dasha lord sequence (repeats every 9 nakshatras) with total years each rules
const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const DASHA_YEARS = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};
const TOTAL_CYCLE_YEARS = 120;

/**
 * @param {number} moonSiderealLongitude - Moon's sidereal longitude in degrees (0-360)
 * @param {Date} birthDateUTC
 * @returns full Vimshottari dasha timeline starting from birth
 */
export function calculateVimshottariDasha(moonSiderealLongitude, birthDateUTC) {
  const nakshatraSpan = 360 / 27; // 13.333... degrees per nakshatra
  const nakshatraIndex = Math.floor(moonSiderealLongitude / nakshatraSpan);
  const nakshatraName = NAKSHATRAS[nakshatraIndex];

  // How far through the current nakshatra the Moon already is (0 to 1)
  const positionInNakshatra = (moonSiderealLongitude % nakshatraSpan) / nakshatraSpan;

  // Starting dasha lord = the one assigned to this nakshatra
  const startLordIndex = nakshatraIndex % 9;
  const startLord = DASHA_SEQUENCE[startLordIndex];

  // Balance of the first (already-running) dasha at birth
  const fullLordYears = DASHA_YEARS[startLord];
  const elapsedYears = fullLordYears * positionInNakshatra;
  const balanceYears = fullLordYears - elapsedYears;

  const timeline = [];
  let cursor = new Date(birthDateUTC);

  // First entry: the balance of the birth dasha
  let endDate = addYears(cursor, balanceYears);
  timeline.push({
    lord: startLord,
    startDate: cursor.toISOString(),
    endDate: endDate.toISOString(),
    years: round2(balanceYears),
    isBirthDashaBalance: true
  });
  cursor = endDate;

  // Subsequent full dashas, cycling through the sequence, until we've covered ~120 years
  let idx = startLordIndex;
  let totalCovered = balanceYears;
  while (totalCovered < TOTAL_CYCLE_YEARS) {
    idx = (idx + 1) % 9;
    const lord = DASHA_SEQUENCE[idx];
    const years = DASHA_YEARS[lord];
    endDate = addYears(cursor, years);
    timeline.push({
      lord,
      startDate: cursor.toISOString(),
      endDate: endDate.toISOString(),
      years,
      isBirthDashaBalance: false
    });
    cursor = endDate;
    totalCovered += years;
  }

  return {
    nakshatra: nakshatraName,
    nakshatraIndex,
    positionInNakshatra: round2(positionInNakshatra * 100), // as %
    mahadashaTimeline: timeline
  };
}

function addYears(date, years) {
  const ms = years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export { NAKSHATRAS, DASHA_SEQUENCE, DASHA_YEARS };
