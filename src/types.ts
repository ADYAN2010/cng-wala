// Type definitions for CNG WALA — DHANMONDI SHIFT
// Expanded Full Dhanmondi Coverage

export interface Vector2D {
  x: number;
  z: number;
}

export interface RoadSegment {
  id: string;
  nameBangla: string;
  nameEnglish: string;
  start: Vector2D;
  end: Vector2D;
  width: number;
  lanes: number;
  speedLimit: number;
  isMainArtery?: boolean;
  roadType?: 'main' | 'sub' | 'bridge';
}

export interface Landmark {
  id: string;
  nameBangla: string;
  nameEnglish: string;
  position: Vector2D;
  radius: number;
  description: string;
  category: 'cng_stand' | 'bus_stop' | 'hospital' | 'shopping' | 'landmark' | 'restaurant' | 'sports' | 'metro';
}

export type PassengerArchetype = 
  | 'student'
  | 'office_worker'
  | 'elderly'
  | 'shopper'
  | 'hospital_patient'
  | 'local_resident';

export interface PassengerData {
  id: string;
  name: string;
  nameBangla: string;
  archetype: PassengerArchetype;
  pickupLocation: Vector2D;
  pickupNameBangla: string;
  destination: Vector2D;
  destinationNameBangla: string;
  destinationNameEnglish: string;
  targetFare: number;       // Passenger's ideal fare in BDT
  maxFare: number;          // Maximum passenger will pay in BDT
  patience: number;         // 0 to 1
  avatarColor: string;
  clothingColor: string;
  status: 'waiting' | 'bargaining' | 'boarding' | 'riding' | 'dropped_off' | 'left';
}

export interface DialogueChoice {
  id: string;
  labelBangla: string;
  labelEnglish: string;
  fareOffer?: number;
  type: 'agree' | 'counter' | 'reject' | 'meter_plus';
}

export interface DialogueStep {
  speaker: 'passenger' | 'driver';
  speakerNameBangla: string;
  textBangla: string;
  textEnglish: string;
  audioVoiceType?: 'young_male' | 'young_female' | 'adult_male' | 'elderly_male';
  choices?: DialogueChoice[];
}

export interface VehicleTelemetry {
  speedKmh: number;
  rpm: number;
  gear: 'N' | '1' | '2' | '3' | '4' | 'R';
  steerAngle: number;
  throttle: number;
  brake: number;
  handbrake: boolean;
  headlights: boolean;
  horn: boolean;
  fuelPercent: number;
  bodyRoll: number;
  bodyPitch: number;
}

export interface ShiftStats {
  cash: number;
  todayEarnings: number;
  dailyRentGoal: number;    // Rent owed to CNG owner (জমা)
  rentPaid: boolean;
  totalTripsCompleted: number;
  fuelRemaining: number;     // 0 to 100%
  shiftTimeMinutes: number;  // In-game minutes elapsed (e.g. 7:00 AM = 420 mins)
  reputation: number;        // 0 to 100
}

export interface VehicleUpgrades {
  engineLevel: number;        // 1 to 3 (+15% speed/accel per level)
  brakesLevel: number;        // 1 to 3 (+25% braking power per level)
  tankCapacityLevel: number;  // 1 to 3 (+25% fuel capacity per level)
  bodyDecal: 'classic' | 'tiger' | 'dhaka_king' | 'rickshaw_art';
  hornType: 'standard' | 'musical' | 'airhorn';
}

export interface GameStatistics {
  lifetimeEarnings: number;
  totalTripsCompleted: number;
  totalDistanceKm: number;
  fuelPurchasedLiters: number;
  accidentsReported: number;
  highestSingleFare: number;
  tipsReceivedTotal: number;
  daysOnRoad: number;
}

export interface GameSaveData {
  version: number;
  lastSaved: string;
  storageBackend: 'indexeddb' | 'localstorage_fallback';
  stats: ShiftStats;
  upgrades: VehicleUpgrades;
  unlockedAreas: string[];
  statistics: GameStatistics;
}

export type GraphicsPreset = 'auto' | 'low' | 'medium' | 'high' | 'ultra' | 'custom';

export type ShadowQuality = 'off' | 'low' | 'medium' | 'high';
export type TextureQuality = 'low' | 'medium' | 'high';
export type ViewDistance = 'low' | 'medium' | 'high' | 'ultra';
export type DensityLevel = 'low' | 'medium' | 'high';

export interface GraphicsProfileSettings {
  preset: GraphicsPreset;
  resolutionScale: number;      // 0.5 to 1.0
  shadowQuality: ShadowQuality;
  textureQuality: TextureQuality;
  viewDistance: ViewDistance;
  environmentDetail: DensityLevel;
  trafficDensity: DensityLevel;
  pedestrianDensity: DensityLevel;
  vegetationDensity: DensityLevel;
  waterQuality: 'low' | 'high';
  weatherParticles: 'off' | 'low' | 'medium' | 'high';
  antiAliasing: boolean;
  targetFpsLimit: number;       // 30, 45, 60, 90, 120, 0 (unlimited)
  autoOptimization: boolean;
  showDevOverlay: boolean;
}

export interface HardwareCapabilities {
  rendererString: string;
  vendorString: string;
  isMobile: boolean;
  devicePixelRatio: number;
  maxTextureSize: number;
  deviceMemoryGb?: number;
  hardwareConcurrency?: number;
  benchmarkScore: number;       // 0 to 100 estimated score
  recommendedPreset: 'low' | 'medium' | 'high' | 'ultra';
}

export interface GameSettings {
  graphics: GraphicsProfileSettings;
  audioVolume: number;
  voiceVolume: number;
  subtitlesEnabled: boolean;
  steeringSensitivity: number;
}

export interface TrafficVehicleData {
  id: string;
  type: 'bus' | 'cng' | 'rickshaw' | 'leguna' | 'car' | 'motorcycle';
  position: { x: number; y: number; z: number };
  speed: number;
  targetSpeed: number;
  rotationY: number;
  currentRoadId: string;
  laneOffset: number;
  color: string;
}
