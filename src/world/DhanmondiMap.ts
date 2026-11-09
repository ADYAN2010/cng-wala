// Complete Dhanmondi Road Network & Landmark Registry
// Matches geographic boundary and illustrated game map art reference
import { RoadSegment, Landmark, Vector2D } from '../types';

export class DhanmondiMap {
  // Dhanmondi Boundary Coordinates
  public static readonly BOUNDS = {
    minX: -190,
    maxX: 210,
    minZ: -290,
    maxZ: 270
  };

  // Connected Full Road Network
  public static readonly ROADS: RoadSegment[] = [
    // ---------------- 1. SATMASJID ROAD (WESTERN COMMERCIAL SPINE) ----------------
    // Golden-yellow main artery running continuous north to south
    {
      id: 'satmasjid_sec1',
      nameBangla: 'সাত মসজিদ রোড (উত্তর - ২৭ মোড়)',
      nameEnglish: 'Satmasjid Road (North - Rd 27)',
      start: { x: -160, z: -260 },
      end: { x: -160, z: -160 },
      width: 15,
      lanes: 4,
      speedLimit: 45,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'satmasjid_sec2',
      nameBangla: 'সাত মসজিদ রোড (শংকর মোড় অংশ)',
      nameEnglish: 'Satmasjid Road (Shankar Section)',
      start: { x: -160, z: -160 },
      end: { x: -160, z: -60 },
      width: 15,
      lanes: 4,
      speedLimit: 45,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'satmasjid_sec3',
      nameBangla: 'সাত মসজিদ রোড (আবাহনী ক্লাব সংলগ্ন)',
      nameEnglish: 'Satmasjid Road (Abahani Club Section)',
      start: { x: -160, z: -60 },
      end: { x: -160, z: 50 },
      width: 15,
      lanes: 4,
      speedLimit: 45,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'satmasjid_sec4',
      nameBangla: 'সাত মসজিদ রোড (ইবনে সিনা - ৮/এ অংশ)',
      nameEnglish: 'Satmasjid Road (Ibn Sina - 8/A)',
      start: { x: -160, z: 50 },
      end: { x: -160, z: 150 },
      width: 15,
      lanes: 4,
      speedLimit: 45,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'satmasjid_sec5',
      nameBangla: 'সাত মসজিদ রোড (দক্ষিণ - জিগাতলা সংযোগ)',
      nameEnglish: 'Satmasjid Road (South - Jigatola)',
      start: { x: -160, z: 150 },
      end: { x: -160, z: 240 },
      width: 15,
      lanes: 4,
      speedLimit: 45,
      isMainArtery: true,
      roadType: 'main'
    },

    // ---------------- 2. MIRPUR ROAD (EASTERN TRANSIT TRUNK) ----------------
    {
      id: 'mirpur_sec1',
      nameBangla: 'মিরপুর রোড (উত্তর - সোবহানবাগ / ২৭ সংযোগ)',
      nameEnglish: 'Mirpur Road (North - Sobhanbagh)',
      start: { x: 160, z: -260 },
      end: { x: 160, z: -160 },
      width: 17,
      lanes: 6,
      speedLimit: 50,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'mirpur_sec2',
      nameBangla: 'মিরপুর রোড (ধানমন্ডি ৩২ অংশ)',
      nameEnglish: 'Mirpur Road (Dhanmondi 32 Section)',
      start: { x: 160, z: -160 },
      end: { x: 160, z: -50 },
      width: 17,
      lanes: 6,
      speedLimit: 50,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'mirpur_sec3',
      nameBangla: 'মিরপুর রোড (কলাবাগান - ল্যাবএইড অংশ)',
      nameEnglish: 'Mirpur Road (Kalabagan - LABAID)',
      start: { x: 160, z: -50 },
      end: { x: 160, z: 70 },
      width: 17,
      lanes: 6,
      speedLimit: 50,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'mirpur_sec4',
      nameBangla: 'মিরপুর রোড (দক্ষিণ - সায়েন্স ল্যাব সংযোগ)',
      nameEnglish: 'Mirpur Road (South - Science Lab)',
      start: { x: 160, z: 70 },
      end: { x: 160, z: 240 },
      width: 17,
      lanes: 6,
      speedLimit: 50,
      isMainArtery: true,
      roadType: 'main'
    },

    // ---------------- 3. NORTHERN BOUNDARY (ROAD 27 & MANIK MIA AVE) ----------------
    {
      id: 'road_27_west',
      nameBangla: 'ধানমন্ডি ২৭ নং রোড (পশ্চিম অংশ)',
      nameEnglish: 'Dhanmondi Road 27 (West)',
      start: { x: -160, z: -260 },
      end: { x: 0, z: -260 },
      width: 14,
      lanes: 4,
      speedLimit: 40,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'road_27_east',
      nameBangla: 'ধানমন্ডি ২৭ নং রোড (পূর্ব অংশ - রাপা প্লাজা)',
      nameEnglish: 'Dhanmondi Road 27 (East - Rapa Plaza)',
      start: { x: 0, z: -260 },
      end: { x: 160, z: -260 },
      width: 14,
      lanes: 4,
      speedLimit: 40,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'manik_mia_ave',
      nameBangla: 'মানিক মিয়া এভিনিউ (ফার্মগেট মেট্রোরেল সংযোগ)',
      nameEnglish: 'Manik Mia Ave (To Metro Rail)',
      start: { x: 160, z: -260 },
      end: { x: 250, z: -310 },
      width: 15,
      lanes: 4,
      speedLimit: 45,
      isMainArtery: true,
      roadType: 'main'
    },

    // ---------------- 4. SOUTHERN BOUNDARY (ROAD 2 / JIGATOLA) ----------------
    {
      id: 'road_2_west',
      nameBangla: 'ধানমন্ডি রোড ২ (জিগাতলা অংশ)',
      nameEnglish: 'Dhanmondi Road 2 (Jigatola West)',
      start: { x: -160, z: 240 },
      end: { x: 0, z: 240 },
      width: 14,
      lanes: 4,
      speedLimit: 40,
      isMainArtery: true,
      roadType: 'main'
    },
    {
      id: 'road_2_east',
      nameBangla: 'ধানমন্ডি রোড ২ (সায়েন্স ল্যাব সংযোগ)',
      nameEnglish: 'Dhanmondi Road 2 (Science Lab East)',
      start: { x: 0, z: 240 },
      end: { x: 160, z: 240 },
      width: 14,
      lanes: 4,
      speedLimit: 40,
      isMainArtery: true,
      roadType: 'main'
    },

    // ---------------- 5. EAST-WEST CROSS CONNECTORS ----------------
    // Road 15/A (Northern residential connector)
    {
      id: 'road_15a',
      nameBangla: 'ধানমন্ডি ১৫/এ রোড',
      nameEnglish: 'Dhanmondi Road 15/A',
      start: { x: -160, z: -160 },
      end: { x: -45, z: -160 },
      width: 9,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },
    // Road 9/A (North of Abahani Club)
    {
      id: 'road_9a',
      nameBangla: 'ধানমন্ডি ৯/এ রোড (আবাহনী উত্তর)',
      nameEnglish: 'Dhanmondi Road 9/A',
      start: { x: -160, z: -60 },
      end: { x: -45, z: -60 },
      width: 9,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },
    // Road 8/A (Major connector past Ibn Sina to Lake Bridge)
    {
      id: 'road_8a',
      nameBangla: 'ধানমন্ডি ৮/এ রোড',
      nameEnglish: 'Dhanmondi Road 8/A',
      start: { x: -160, z: 70 },
      end: { x: -45, z: 70 },
      width: 11,
      lanes: 2,
      speedLimit: 35,
      roadType: 'main'
    },
    // Road 12/A (Internal residential link)
    {
      id: 'road_12a',
      nameBangla: 'ধানমন্ডি ১২/এ রোড',
      nameEnglish: 'Dhanmondi Road 12/A',
      start: { x: -105, z: -60 },
      end: { x: -105, z: 70 },
      width: 8,
      lanes: 2,
      speedLimit: 25,
      roadType: 'sub'
    },
    // Road 8 (East side - Rabindra Sarobar to Mirpur Road / LABAID)
    {
      id: 'road_8_east',
      nameBangla: 'ধানমন্ডি ৮ নং রোড (রবীন্দ্র সরোবর - ল্যাবএইড)',
      nameEnglish: 'Dhanmondi Road 8 (East - LABAID)',
      start: { x: 45, z: 70 },
      end: { x: 160, z: 70 },
      width: 11,
      lanes: 2,
      speedLimit: 35,
      roadType: 'main'
    },
    // Road 7 (Magicians Street loop)
    {
      id: 'road_7',
      nameBangla: 'ধানমন্ডি ৭ নং রোড',
      nameEnglish: 'Dhanmondi Road 7',
      start: { x: 45, z: 140 },
      end: { x: 110, z: 70 },
      width: 8,
      lanes: 2,
      speedLimit: 25,
      roadType: 'sub'
    },
    // Road 32 (East side - Lake to Mirpur Road / Historic 32)
    {
      id: 'road_32',
      nameBangla: 'ধানমন্ডি ৩২ নং সড়ক',
      nameEnglish: 'Dhanmondi Road 32',
      start: { x: 40, z: -70 },
      end: { x: 160, z: -70 },
      width: 10,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },

    // ---------------- 6. DHANMONDI LAKE PERIMETER ROADS & BRIDGE ----------------
    // Lake Drive West (North Section)
    {
      id: 'lake_drive_w_north',
      nameBangla: 'লেক ড্রাইভ পশ্চিম (উত্তর অংশ)',
      nameEnglish: 'Lake Drive West (North)',
      start: { x: -45, z: -260 },
      end: { x: -45, z: -60 },
      width: 9,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },
    // Lake Drive West (South Section)
    {
      id: 'lake_drive_w_south',
      nameBangla: 'লেক ড্রাইভ পশ্চিম (দক্ষিণ অংশ)',
      nameEnglish: 'Lake Drive West (South)',
      start: { x: -45, z: -60 },
      end: { x: -45, z: 190 },
      width: 9,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },
    // Lake Drive East (North Section)
    {
      id: 'lake_drive_e_north',
      nameBangla: 'লেক ড্রাইভ পূর্ব (উত্তর অংশ)',
      nameEnglish: 'Lake Drive East (North)',
      start: { x: 45, z: -260 },
      end: { x: 45, z: -60 },
      width: 9,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },
    // Lake Drive East (South Section - Rabindra Sarobar)
    {
      id: 'lake_drive_e_south',
      nameBangla: 'লেক ড্রাইভ পূর্ব (রবীন্দ্র সরোবর অংশ)',
      nameEnglish: 'Lake Drive East (South)',
      start: { x: 45, z: -60 },
      end: { x: 45, z: 190 },
      width: 9,
      lanes: 2,
      speedLimit: 30,
      roadType: 'sub'
    },
    // The Iconic Lake Arched Bridge (Connecting 8/A directly across to Rabindra Sarobar!)
    {
      id: 'lake_bridge_central',
      nameBangla: 'ধানমন্ডি লেক আর্চ ব্রিজ (৮/এ - রবীন্দ্র সরোবর)',
      nameEnglish: 'Dhanmondi Lake Bridge (8/A - Rabindra Sarobar)',
      start: { x: -45, z: 70 },
      end: { x: 45, z: 70 },
      width: 8,
      lanes: 2,
      speedLimit: 25,
      roadType: 'bridge'
    },
    // Lake South Loop (Connecting south tips to Road 2)
    {
      id: 'lake_south_loop_w',
      nameBangla: 'লেক সংযোগ দক্ষিণ (পশ্চিম)',
      nameEnglish: 'Lake South Link (West)',
      start: { x: -45, z: 190 },
      end: { x: -60, z: 240 },
      width: 8,
      lanes: 2,
      speedLimit: 25,
      roadType: 'sub'
    },
    {
      id: 'lake_south_loop_e',
      nameBangla: 'লেক সংযোগ দক্ষিণ (পূর্ব)',
      nameEnglish: 'Lake South Link (East)',
      start: { x: 45, z: 190 },
      end: { x: 60, z: 240 },
      width: 8,
      lanes: 2,
      speedLimit: 25,
      roadType: 'sub'
    }
  ];

  // Comprehensive Landmarks across entire Dhanmondi matching visual reference
  public static readonly LANDMARKS: Landmark[] = [
    {
      id: 'dhanmondi_27',
      nameBangla: 'ধানমন্ডি ২৭ (রাপা প্লাজা)',
      nameEnglish: 'Dhanmondi 27 (Rapa Plaza)',
      position: { x: -140, z: -260 },
      radius: 25,
      description: 'ব্যস্ততম বাণিজ্যিক মোড়, রাপা প্লাজা শপিং কমপ্লেক্স ও নামিদামি রেস্তোরাঁ',
      category: 'shopping'
    },
    {
      id: 'city_hospital',
      nameBangla: 'সিটি হাসপাতাল (ধানমন্ডি ২৭ উত্তর)',
      nameEnglish: 'City Hospital & Diagnostic',
      position: { x: -160, z: -275 },
      radius: 20,
      description: 'জরুরি স্বাস্থ্যসেবা ও রোগী পরিবহনের প্রধান কেন্দ্র',
      category: 'hospital'
    },
    {
      id: 'bangladesh_eye_hospital',
      nameBangla: 'বাংলাদেশ আই হাসপাতাল',
      nameEnglish: 'Bangladesh Eye Hospital',
      position: { x: -160, z: -200 },
      radius: 20,
      description: 'বিশেষায়িত চক্ষু চিকিৎসা কেন্দ্র ও ফার্মেসি সংলগ্ন এলাকা',
      category: 'hospital'
    },
    {
      id: 'shankar_crossing',
      nameBangla: 'শংকর মোড় ও কাঁচাবাজার',
      nameEnglish: 'Shankar Crossing',
      position: { x: -160, z: -110 },
      radius: 22,
      description: 'জনাকীর্ণ মোড়, মিষ্টির দোকান, ফলের আড়ত ও লেগুনা স্ট্যান্ড',
      category: 'bus_stop'
    },
    {
      id: 'abahani_club',
      nameBangla: 'আবাহনী ক্লাব মাঠ',
      nameEnglish: 'Abahani Club Stadium',
      position: { x: -110, z: -10 },
      radius: 35,
      description: 'ঐতিহাসিক সবুজ ক্রীড়াক্ষেত্র ও বিশাল মুক্ত আকাশ',
      category: 'sports'
    },
    {
      id: 'ibn_sina',
      nameBangla: 'ইবনে সিনা স্পেশালাইজড হাসপাতাল',
      nameEnglish: 'IBN Sina Specialized Hospital',
      position: { x: -160, z: 50 },
      radius: 22,
      description: '২৪ ঘণ্টার জরুরি বিভাগ ও সার্বক্ষণিক রোগীবাহী যানচলাচল',
      category: 'hospital'
    },
    {
      id: 'dhanmondi_8a',
      nameBangla: 'ধানমন্ডি ৮/এ মোড়',
      nameEnglish: 'Dhanmondi 8/A Crossing',
      position: { x: -160, z: 70 },
      radius: 22,
      description: 'কেএফসি, ক্যাফে ও আবাসিক সড়ক সংবলিত জনপ্রিয় স্পট',
      category: 'restaurant'
    },
    {
      id: 'jigatola_bus_stand',
      nameBangla: 'জিগাতলা বাস স্ট্যান্ড',
      nameEnglish: 'Jigatola Bus Stand',
      position: { x: -160, z: 240 },
      radius: 25,
      description: 'শত শত যাত্রী, স্থানীয় বাস ও লেগুনার প্রধান টার্মিনাল',
      category: 'bus_stop'
    },
    {
      id: 'cng_stand_home',
      nameBangla: 'ধানমন্ডি সিএনজি স্ট্যান্ড (গ্যারেজ)',
      nameEnglish: 'Dhanmondi CNG Stand & Garage',
      position: { x: -110, z: 220 },
      radius: 20,
      description: 'সিএনজি চালকদের প্রধান আড্ডাখানা ও দৈনিক শিফট শুরু',
      category: 'cng_stand'
    },
    {
      id: 'rabindra_sarobar',
      nameBangla: 'রবীন্দ্র সরোবর মুক্তমঞ্চ',
      nameEnglish: 'Rabindra Sarobar Amphitheater',
      position: { x: 65, z: 75 },
      radius: 30,
      description: 'লেকের পাড়ের লাল ইটের মুক্তমঞ্চ, টংয়ের গরম চা ও ফুচকা চত্বর',
      category: 'landmark'
    },
    {
      id: 'dhanmondi_lake_bridge',
      nameBangla: 'ধানমন্ডি লেক আর্চ ব্রিজ',
      nameEnglish: 'Dhanmondi Lake Bridge',
      position: { x: 0, z: 70 },
      radius: 18,
      description: 'লেকের ওপর দৃষ্টিনন্দন সংযোগ সেতু',
      category: 'landmark'
    },
    {
      id: 'dhanmondi_32',
      nameBangla: 'ধানমন্ডি ৩২ (স্মৃতি জাদুঘর)',
      nameEnglish: 'Dhanmondi 32 Historic Zone',
      position: { x: 100, z: -70 },
      radius: 25,
      description: 'ঐতিহাসিক ৩২ নম্বর সড়ক ও শান্ত আবাসিক লেকভিউ',
      category: 'landmark'
    },
    {
      id: 'labaid_hospital',
      nameBangla: 'ল্যাবএইড স্পেশালাইজড হাসপাতাল',
      nameEnglish: 'LABAID Specialized Hospital',
      position: { x: 160, z: 70 },
      radius: 24,
      description: 'মিরপুর রোডের বিখ্যাত কার্ডিয়াক হাসপাতাল ও জরুরি ক্রসিং',
      category: 'hospital'
    },
    {
      id: 'science_lab',
      nameBangla: 'সায়েন্স ল্যাবরেটরি মোড়',
      nameEnglish: 'Science Laboratory Crossing',
      position: { x: 160, z: 240 },
      radius: 26,
      description: 'ঢাকা কলেজ ও সায়েন্স ল্যাবের চিরব্যস্ত ট্রাফিক মোড়',
      category: 'bus_stop'
    },
    {
      id: 'farmgate_metro',
      nameBangla: 'ফার্মগেট - মেট্রোরেল স্টেশন',
      nameEnglish: 'Farmgate - Metro Rail MRT-6',
      position: { x: 250, z: -310 },
      radius: 32,
      description: 'ঢাকা মেট্রোরেল লাইন ৬ এর উড়াল ভায়াডাক্ট ও ট্রেন স্টেশন',
      category: 'metro'
    }
  ];

  public static getLandmark(id: string): Landmark | undefined {
    return this.LANDMARKS.find(l => l.id === id);
  }

  // Get random trip pairs with good geographic separation across full Dhanmondi
  public static getRandomTripPoints(): { pickup: Landmark; destination: Landmark } {
    const list = [...this.LANDMARKS.filter(l => l.id !== 'cng_stand_home')];
    const pIdx = Math.floor(Math.random() * list.length);
    const pickup = list[pIdx];
    list.splice(pIdx, 1);

    // Pick destination at least 140 units away for a meaningful trip
    let destination = list[0];
    let maxDistFound = 0;
    for (let i = 0; i < list.length; i++) {
      const candidate = list[i];
      const dist = Math.hypot(candidate.position.x - pickup.position.x, candidate.position.z - pickup.position.z);
      if (dist >= 140) {
        destination = candidate;
        break;
      }
      if (dist > maxDistFound) {
        maxDistFound = dist;
        destination = candidate;
      }
    }
    return { pickup, destination };
  }

  // Find nearest road to a point
  public static findNearestRoad(pos: Vector2D): RoadSegment {
    let bestRoad = this.ROADS[0];
    let minDistance = Infinity;

    for (const road of this.ROADS) {
      const d = this.distancePointToSegment(pos, road.start, road.end);
      if (d < minDistance) {
        minDistance = d;
        bestRoad = road;
      }
    }
    return bestRoad;
  }

  private static distancePointToSegment(p: Vector2D, a: Vector2D, b: Vector2D): number {
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const apx = p.x - a.x;
    const apz = p.z - a.z;
    const abLenSq = abx * abx + abz * abz;
    if (abLenSq === 0) return Math.hypot(apx, apz);

    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
    const projX = a.x + t * abx;
    const projZ = a.z + t * abz;
    return Math.hypot(p.x - projX, p.z - projZ);
  }
}
