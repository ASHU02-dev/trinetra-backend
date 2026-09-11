# TRINETRA Kundli Backend — Setup

## Ye kya hai
Ek Node.js/Express backend jo name + DOB + time of birth + place + gender leke:
- D1 (Rashi) chart — sab grahas kaunse rashi me hain
- D9 (Navamsa) chart
- Vimshottari Mahadasha timeline (poori zindagi ki dasha sequence)

...calculate karta hai using Swiss Ephemeris (free, open-source, industry-standard).

## Setup (apne machine ya Claude Code me)

```bash
cd trinetra-backend
npm install
npm start
```

Server `http://localhost:4000` pe chalega.

## Test karne ke liye

```bash
curl -X POST http://localhost:4000/api/kundli \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "gender": "male",
    "dob": "1998-08-15",
    "tob": "14:30",
    "place": "Shimla",
    "district": "Shimla",
    "state": "Himachal Pradesh"
  }'
```

## Important notes

1. **Accuracy / Moshier mode**: Abhi ye "Moshier" built-in approximation mode use kar raha hai — bina kisi extra file download ke, aur normal birth dates (1800-2400 AD range) ke liye chand arc-seconds tak accurate hai, jo kundli ke liye kaafi hai. Agar future me maximum precision chahiye, `.se1` ephemeris files download karke `sweph.set_ephe_path()` se point kar sakte ho — file: https://www.astro.com/ftp/swisseph/ephe/

2. **Geocoding**: Place → lat/long ke liye OpenStreetMap Nominatim use ho raha hai (free, no API key). Isme rate limit hai (1 request/sec) — production me thoda caching add karna better rahega (same place baar baar lookup na ho).

3. **Time zone**: Abhi sirf IST (+5:30) assume kar raha hai (sab India clients ke liye correct). Agar kabhi non-India clients aaye to timezone logic extend karni padegi.

4. **Ascendant/Lagna**: `houses_ex` Placidus house system use kar raha hai sirf Ascendant nikalne ke liye — full house cusps chahiye ho to wo bhi available hai `houses.data.cusps` me.

## Next steps (backend side)
- [ ] D10 (Dashamsha - career) aur baaki varga charts add karna
- [ ] Antardasha (sub-periods within mahadasha) calculate karna
- [ ] Geocoding results cache karna (same place repeat lookups avoid)
- [ ] PDF report generation (kundli + dasha ka downloadable report banake WhatsApp/email pe bhej sako)
- [ ] Deploy karna kahi (Render/Railway free tier accha hai shuru ke liye)

## Next steps (frontend side)
- Is API se aane wale `d1Chart` / `d9Chart` data ko North Indian ya South Indian chart style me draw karna (SVG) — ye new theme ke saath design karenge
