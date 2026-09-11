// server.js
import express from "express";
import cors from "cors";
import { geocodePlace, getIndiaUtcOffsetMinutes } from "./services/geocode.js";
import { calculatePositions, calculateNavamsa } from "./services/kundliEngine.js";
import { calculateVimshottariDasha } from "./services/dasha.js";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * POST /api/kundli
 * Body: {
 *   name: string,
 *   gender: "male" | "female",
 *   dob: "YYYY-MM-DD",
 *   tob: "HH:MM",           // 24-hour, local time at place of birth
 *   place: string,
 *   district: string,
 *   state: string
 * }
 */
app.post("/api/kundli", async (req, res) => {
  try {
    const { name, gender, dob, tob, place, district, state } = req.body;

    if (!name || !dob || !tob || !place || !state) {
      return res.status(400).json({ error: "name, dob, tob, place, and state are required." });
    }

    const [year, month, day] = dob.split("-").map(Number);
    const [hour, minute] = tob.split(":").map(Number);

    const { lat, lon, displayName } = await geocodePlace(place, district, state);
    const utcOffsetMinutes = getIndiaUtcOffsetMinutes();

    const { positions, ayanamsa } = calculatePositions({
      year, month, day, hour, minute, lat, lon, utcOffsetMinutes
    });

    const navamsa = calculateNavamsa(positions);

    const moonLon = positions.Moon.rashiIndex * 30 + positions.Moon.degreeInRashi;
    const birthDateUTC = new Date(Date.UTC(year, month - 1, day, hour - Math.floor(utcOffsetMinutes / 60), minute - (utcOffsetMinutes % 60)));
    const dasha = calculateVimshottariDasha(moonLon, birthDateUTC);

    res.json({
      name,
      gender,
      birthDetails: { dob, tob, place: displayName, lat, lon },
      ayanamsa,
      d1Chart: positions,       // Rashi chart
      d9Chart: navamsa,         // Navamsa chart
      vimshottariDasha: dasha
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Kundli generation failed." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TRINETRA kundli backend running on port ${PORT}`));
