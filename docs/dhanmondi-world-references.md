# Dhanmondi World & Architectural Reference Guide
### Project: CNG WALA — DHANMONDI SHIFT
### Visual References: Google Maps Perimeter & Illustrated Dhanmondi Game Map

This document establishes the comprehensive geographical, architectural, and visual art reference for the full open-world reconstruction of Dhanmondi, Dhaka, Bangladesh.

---

## 1. Geographic Boundary & Full Neighborhood Scope

Based on the official Dhanmondi boundary marked in the Google Maps satellite reference (`media_1794237416278_b40138c3.jpg` & `media_1794237650911_d3dab3e1.jpg`) and the illustrated game map (`media_1794237620251_d1f154ec.jpg`):

- **North Boundary:** Dhanmondi Road 27 (connecting Satmasjid Road across to Mirpur Road / Sobhanbagh), Manik Mia Avenue, and Asad Avenue corridor.
- **South Boundary:** Dhanmondi Road No. 2 (stretching continuously from Jigatola Bus Stand eastwards across to Mirpur Road / Science Laboratory / Dhaka College perimeter).
- **West Boundary:** Satmasjid Road (the primary commercial spine stretching from Road 27 in the north, past Shankar, Abahani Club, Ibn Sina, down to Jigatola).
- **East Boundary:** Mirpur Road (the trunk arterial linking Science Lab in the south, past LABAID Specialized Hospital, Road 8, Dhanmondi 32, up to Sobhanbagh / Dhanmondi 27 in the north).
- **Northeast Metro Corridor:** Elevated Dhaka Metro Rail (MRT Line 6) viaduct connecting along the outer perimeter toward Farmgate & Karwan Bazar.
- **Central Water Body:** Dhanmondi Lake, meandering from north to south with lush parks on both banks, the iconic Lake Arched Bridge connecting Road 8/A directly across to Rabindra Sarobar, and twin organic southern fingers branching toward Road 2.

### Complete Road Hierarchy & Visual Stylization

| Road Name | Category | Art Style (Illustrated Reference) | Width & Function |
|---|---|---|---|
| **Satmasjid Road (সাত মসজিদ রোড)** | Primary Commercial Artery | Golden-Yellow Road with white edges, central green median trees & sodium lamps | 15m (4-6 lanes), heavy buses, CNGs, rickshaws |
| **Mirpur Road (মিরপুর রোড)** | Primary Transit Arterial | Golden-Yellow Road with white dashed lane lines | 17m (6 lanes), high volume traffic |
| **Dhanmondi 27 (Road 27)** | Major Crossway | Golden-Yellow Road with pedestrian crossings at Rapa Plaza | 14m (4 lanes), modern shopping & fast food |
| **Dhanmondi Road 2 (রোড ২)** | Southern Crossway | Golden-Yellow Road connecting Jigatola to Science Lab | 14m (4 lanes), schools, colleges, border |
| **Road 8/A (রোড ৮/এ)** | Commercial & Residential Trunk | Golden-Yellow Road linking Satmasjid Rd to Lake Bridge | 11m (2-3 lanes), KFC, cafes, bridge approach |
| **Road 8 East (রোড ৮)** | Eastside Artery | Golden-Yellow Road from Rabindra Sarobar to LABAID Hospital | 11m (2-3 lanes), lakeview restaurants |
| **Road 15/A, 9/A, 12/A, 7, 32** | Residential Sub-Roads | Dark Grey Asphalt (`#2f3542`) with yellow speed bumps & curbs | 8-10m (2 lanes), apartments & alleys |
| **Dhanmondi Lake Bridge** | Lake Crossing Arched Bridge | Terracotta Brick / Wood Deck (`#b33927`) with safety railings | 8m (2 lanes), pedestrian & light vehicle crossing |
| **Lake Promenades (East & West)** | Scenic Lake Drives | Dark Grey Asphalt flanked by lush green trees | 9m (2 lanes), morning walkers & rickshaws |

---

## 2. Illustrated Game Art Direction (Approach A)

In accordance with the illustrated reference map ("DHANMONDI GAME MAP"):
- **Color Palette:**
  - Main roads: **Vibrant Golden-Yellow** (`#f5c518` / `#e1b12c`) with crisp white outer lines.
  - Sub-roads: **Illustrated Dark Slate Grey** (`#2f3542`) with clean white dashed center dividers.
  - Dhanmondi Lake: **Vibrant Turquoise / Cyan Blue** (`#00a8ff`) with gentle water ripples.
  - Park Vegetation: **Lush Emerald & Forest Green** (`#2ed573` / `#1b7a3e`).
  - Trees: Flowering **Krishnachura Trees** with scarlet red canopies (`#e74c3c`), spreading Banyan trees, and coconut palms.
  - Illustrated Buildings: Cel-shaded pastel tones (cream, mint green, peach, sky blue, terracotta brick) with clean outlines, iron window grills, balconies, and rooftop Gazi/RFL water tanks.
- **Bengali Signage & Badges:**
  - Procedurally generated signage with authentic typography for all major Dhanmondi landmarks.
  - Standardized UI badges with icons: 🏥 Hospitals, 🛍️ Shopping, 🏟️ Sports, 🛺 CNG Stands, 🚇 Metro Rail, 📍 Historic Landmarks.

---

## 3. Landmarks & Interactive Points of Interest

1. **ধানমন্ডি ২৭ / রাপা প্লাজা (Dhanmondi 27 / Rapa Plaza):**
   - High-density retail and shopping district, electronics showrooms, and cafes at the northern boundary.
2. **রবীন্দ্র সরোবর (Rabindra Sarobar):**
   - Cultural open-air amphitheater with red-brick terraces facing the lake, surrounded by *Tong er Dokan* tea stalls, fuchka carts, and lakeside music.
3. **আবাহনী ক্লাব মাঠ (Abahani Club Stadium):**
   - Historic sports complex along Satmasjid Road featuring a green soccer pitch, running track, and blue perimeter walls.
4. **বাংলাদেশ আই হাসপাতাল ও ইবনে সিনা (Eye Hospital & IBN Sina):**
   - Critical medical hubs along Satmasjid Road with frequent passenger trip requests.
5. **ল্যাবএইড স্পেশালাইজড হাসপাতাল (LABAID Specialized Hospital):**
   - Major cardiac and healthcare complex at the intersection of Road 8 and Mirpur Road.
6. **ধানমন্ডি ৩২ (Dhanmondi 32 Historic Zone):**
   - Bangabandhu Memorial Museum and peaceful lakeview residential enclave.
7. **জিগাতলা বাস স্ট্যান্ড ও শংকর (Jigatola & Shankar):**
   - Busy passenger hubs in the south and west with fruit carts (*ডাব*), tea stalls, and local transport.
8. **ঢাকা মেট্রোরেল লাইন ৬ (MRT Line 6 Farmgate Viaduct):**
   - Elevated concrete viaduct along the northeast perimeter with running green-and-white automated trains.

---

## 4. Technical Implementation & Drivable Graph

- **Continuous Road Graph:** Every street, arterial, and residential alley connects without dead-end invisible walls, allowing the player to drive uninterrupted from Dhanmondi 27 in the north down to Jigatola and Road 2 in the south, and from Satmasjid Road in the west across the Lake Bridge to Mirpur Road in the east.
- **Collision Boundaries:** Curbs, building walls, stadium enclosures, and lake edges possess solid box boundaries, keeping driving snappy and responsive without glitching.
- **Spatial Partitioning & 60 FPS:** Optimized geometry and instancing ensure the entire expanded open world renders smoothly on modern web browsers and mobile devices.
