// services/geocode.js
// Converts "place, district, state" into { lat, lon, timezone }
// Uses OpenStreetMap Nominatim (free, no API key) for lat/lon,
// and a timezone lookup for the IST offset (or correct historic offset if needed).

import fetch from "node-fetch";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * @param {string} place   e.g. "Shimla"
 * @param {string} district e.g. "Shimla"
 * @param {string} state   e.g. "Himachal Pradesh"
 * @returns {Promise<{lat: number, lon: number, displayName: string}>}
 */
export async function geocodePlace(place, district, state) {
  const query = [place, district, state, "India"].filter(Boolean).join(", ");

  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: {
      // Nominatim requires a descriptive User-Agent per their usage policy
      "User-Agent": "TrinetraKundliApp/1.0 (contact: ashusml02@gmail.com)"
    }
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error(`Could not find location for "${query}". Try a more specific place name.`);
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name
  };
}

/**
 * For India, timezone is always IST (UTC+5:30) for any date after 1947.
 * If you ever need birth dates before India's timezone unification (pre-1947),
 * you'll need a proper historical timezone DB (e.g. `tz-lookup` + `moment-timezone`).
 * For now this covers the realistic use case (people booking consultations today).
 */
export function getIndiaUtcOffsetMinutes() {
  return 330; // +5:30
}
