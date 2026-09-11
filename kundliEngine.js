// services/kundliEngine.js
// Core Vedic astrology calculation engine using Swiss Ephemeris (`sweph`).
//
// SETUP NOTE: Swiss Ephemeris can run in "Moshier" mode (built-in approximation,
// no external files needed, accurate to a few arcseconds - plenty for kundli use).
// For maximum precision you can later download the .se1 ephemeris files from
// https://www.astro.com/ftp/swisseph/ephe/ and point sweph.set_ephe_path() at them.
// Moshier mode is fine to start with and needs ZERO extra downloads.

import sweph from "sweph";

const PLANETS = {
  Sun: sweph.constants.SE_SUN,
  Moon: sweph.constants.SE_MOON,
  Mars: sweph.constants.SE_MARS,
  Mercury: sweph.constants.SE_MERCURY,
  Jupiter: sweph.constants.SE_JUPITER,
  Venus: sweph.constants.SE_VENUS,
  Saturn: sweph.constants.SE_SATURN,
  Rahu: sweph.constants.SE_TRUE_NODE, // Mean/True Node = Rahu; Ketu = Rahu + 180°
};

const RASHIS = [
  "Mesh", "Vrishabh", "Mithun", "Kark", "Simha", "Kanya",
  "Tula", "Vrishchik", "Dhanu", "Makar", "Kumbh", "Meen"
];

/**
 * Convert local birth datetime + UTC offset into a Julian Day (UT) for sweph.
 */
function toJulianDayUT(year, month, day, hour, minute, utcOffsetMinutes) {
  const localDecimalHour = hour + minute / 60;
  const utDecimalHour = localDecimalHour - utcOffsetMinutes / 60;
  // sweph.julday expects UT hour; SE_GREG_CAL = Gregorian calendar
  return sweph.julday(year, month, day, utDecimalHour, sweph.constants.SE_GREG_CAL);
}

/**
 * Lahiri ayanamsa (standard for Vedic/sidereal charts) in degrees for a given Julian Day.
 */
function getLahiriAyanamsa(jdUT) {
  sweph.set_sid_mode(sweph.constants.SE_SIDM_LAHIRI, 0, 0);
  return sweph.get_ayanamsa_ut(jdUT);
}

/**
 * Sidereal longitude (0-360) for a planet -> which Rashi (0-11) and degree within it.
 */
function longitudeToRashi(siderealLon) {
  const norm = ((siderealLon % 360) + 360) % 360;
  const rashiIndex = Math.floor(norm / 30);
  const degreeInRashi = norm - rashiIndex * 30;
  return { rashi: RASHIS[rashiIndex], rashiIndex, degreeInRashi };
}

/**
 * Calculates sidereal (Nirayana) positions for all main grahas + Ascendant (Lagna).
 */
export function calculatePositions({ year, month, day, hour, minute, lat, lon, utcOffsetMinutes }) {
  const jdUT = toJulianDayUT(year, month, day, hour, minute, utcOffsetMinutes);
  const ayanamsa = getLahiriAyanamsa(jdUT);

  const flags = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_SIDEREAL;

  const positions = {};

  for (const [name, id] of Object.entries(PLANETS)) {
    const result = sweph.calc_ut(jdUT, id, flags);
    const tropicalLon = result.data[0];
    positions[name] = longitudeToRashi(tropicalLon);
  }

  // Ketu is always exactly 180° from Rahu
  const rahuLon = positions.Rahu.rashiIndex * 30 + positions.Rahu.degreeInRashi;
  positions.Ketu = longitudeToRashi(rahuLon + 180);

  // Ascendant (Lagna) - requires houses calculation
  const houses = sweph.houses_ex(jdUT, flags, lat, lon, "P"); // Placidus base, we only need Asc
  positions.Lagna = longitudeToRashi(houses.data.points[0]); // ascendant

  return { jdUT, ayanamsa, positions };
}

/**
 * D9 (Navamsa) chart: each Rashi (30°) is divided into 9 parts of 3°20' each.
 * The navamsa sign depends on the sign type (movable/fixed/dual) per classical rule.
 */
export function calculateNavamsa(positions) {
  const navamsa = {};
  for (const [graha, pos] of Object.entries(positions)) {
    const navamsaIndex = Math.floor(pos.degreeInRashi / (30 / 9)); // 0-8
    // Classical navamsa-sign starting-point rule per rashi group
    const rashiMod = pos.rashiIndex % 3; // 0=movable,1=fixed,2=dual
    let startSign;
    if (rashiMod === 0) startSign = pos.rashiIndex;
    else if (rashiMod === 1) startSign = (pos.rashiIndex + 8) % 12;
    else startSign = (pos.rashiIndex + 4) % 12;

    const finalSignIndex = (startSign + navamsaIndex) % 12;
    navamsa[graha] = { rashi: RASHIS[finalSignIndex], rashiIndex: finalSignIndex };
  }
  return navamsa;
}

export { RASHIS };
