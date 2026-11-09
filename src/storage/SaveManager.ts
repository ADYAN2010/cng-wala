// Production Database-Free Save Management System using IndexedDB & LocalStorage Fallback
import { GameSaveData, ShiftStats, VehicleUpgrades, GameStatistics } from '../types';

export const SAVE_VERSION = 1;
const DB_NAME = 'cng_wala_database';
const DB_STORE = 'player_saves';
const ACTIVE_SAVE_KEY = 'active_save';
const LOCALSTORAGE_FALLBACK_KEY = 'cng_wala_idb_fallback';

export const DEFAULT_SAVE_DATA: GameSaveData = {
  version: SAVE_VERSION,
  lastSaved: new Date().toISOString(),
  storageBackend: 'indexeddb',
  stats: {
    cash: 350,              // Starting cash (টাকা)
    todayEarnings: 0,
    dailyRentGoal: 800,     // Daily rental to CNG owner (জমা)
    rentPaid: false,
    totalTripsCompleted: 0,
    fuelRemaining: 88,
    shiftTimeMinutes: 480,  // 8:00 AM
    reputation: 75
  },
  upgrades: {
    engineLevel: 1,
    brakesLevel: 1,
    tankCapacityLevel: 1,
    bodyDecal: 'classic',
    hornType: 'standard'
  },
  unlockedAreas: ['dhanmondi_lake', 'satmasjid_road', 'mirpur_road', 'dhanmondi_27', 'science_lab'],
  statistics: {
    lifetimeEarnings: 0,
    totalTripsCompleted: 0,
    totalDistanceKm: 0,
    fuelPurchasedLiters: 0,
    accidentsReported: 0,
    highestSingleFare: 0,
    tipsReceivedTotal: 0,
    daysOnRoad: 1
  }
};

export class SaveManager {
  private static instance: SaveManager | null = null;
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable: boolean = true;
  private activeSave: GameSaveData;
  private listeners: Array<(save: GameSaveData) => void> = [];
  private saveTimeout: number | null = null;

  private constructor() {
    this.activeSave = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }

  public static getInstance(): SaveManager {
    if (!this.instance) {
      this.instance = new SaveManager();
    }
    return this.instance;
  }

  // Initialize IndexedDB connection with graceful fallback
  public async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[SaveManager] IndexedDB not available, using localStorage fallback');
      this.isIndexedDBAvailable = false;
      this.loadFromLocalStorageFallback();
      return;
    }

    try {
      this.db = await this.openDatabase();
      const loaded = await this.readFromIndexedDB();
      if (loaded) {
        this.activeSave = this.migrateAndValidate(loaded);
        this.activeSave.storageBackend = 'indexeddb';
        console.log('[SaveManager] Progress loaded from IndexedDB successfully');
      } else {
        // Check if there was an older localStorage save from previous version
        const legacySave = this.checkLegacyLocalStorage();
        if (legacySave) {
          console.log('[SaveManager] Migrated legacy localStorage save to IndexedDB');
          this.activeSave = legacySave;
        } else {
          this.activeSave = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
        }
        await this.writeToIndexedDB(this.activeSave);
      }
    } catch (err) {
      console.warn('[SaveManager] Failed to initialize IndexedDB, falling back to localStorage:', err);
      this.isIndexedDBAvailable = false;
      this.loadFromLocalStorageFallback();
    }

    // Flush any unsaved data when tab/window is closing
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushImmediateSync();
      });
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, SAVE_VERSION);

        request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error || new Error('Unknown IndexedDB open error'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private readFromIndexedDB(): Promise<GameSaveData | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      try {
        const transaction = this.db.transaction([DB_STORE], 'readonly');
        const store = transaction.objectStore(DB_STORE);
        const req = store.get(ACTIVE_SAVE_KEY);

        req.onsuccess = () => {
          resolve((req.result as GameSaveData) || null);
        };

        req.onerror = () => {
          reject(req.error || new Error('IndexedDB read error'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private writeToIndexedDB(data: GameSaveData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      try {
        const transaction = this.db.transaction([DB_STORE], 'readwrite');
        const store = transaction.objectStore(DB_STORE);
        const req = store.put(data, ACTIVE_SAVE_KEY);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error || new Error('IndexedDB write error'));
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback to localStorage if IndexedDB is blocked or disabled
  private loadFromLocalStorageFallback(): void {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_FALLBACK_KEY);
      if (raw) {
        this.activeSave = this.migrateAndValidate(JSON.parse(raw));
        this.activeSave.storageBackend = 'localstorage_fallback';
        return;
      }
      const legacy = this.checkLegacyLocalStorage();
      if (legacy) {
        this.activeSave = legacy;
        this.activeSave.storageBackend = 'localstorage_fallback';
        this.writeToLocalStorageFallback(this.activeSave);
        return;
      }
    } catch {
      // Ignore
    }
    this.activeSave = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.activeSave.storageBackend = 'localstorage_fallback';
  }

  private writeToLocalStorageFallback(data: GameSaveData): void {
    try {
      localStorage.setItem(LOCALSTORAGE_FALLBACK_KEY, JSON.stringify(data));
    } catch {
      // Quota exceeded or disabled
    }
  }

  // Check legacy localStorage format from earlier prototype
  private checkLegacyLocalStorage(): GameSaveData | null {
    try {
      const legacyRaw = localStorage.getItem('cng_wala_save_state');
      if (legacyRaw) {
        const oldStats = JSON.parse(legacyRaw) as ShiftStats;
        const save: GameSaveData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
        save.stats = { ...save.stats, ...oldStats };
        save.statistics.lifetimeEarnings = oldStats.cash || 350;
        save.statistics.totalTripsCompleted = oldStats.totalTripsCompleted || 0;
        return save;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  // Validate and migrate save structure across game updates
  private migrateAndValidate(loaded: Partial<GameSaveData>): GameSaveData {
    const base: GameSaveData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));

    return {
      version: SAVE_VERSION,
      lastSaved: loaded.lastSaved || new Date().toISOString(),
      storageBackend: this.isIndexedDBAvailable ? 'indexeddb' : 'localstorage_fallback',
      stats: {
        ...base.stats,
        ...(loaded.stats || {})
      },
      upgrades: {
        ...base.upgrades,
        ...(loaded.upgrades || {})
      },
      unlockedAreas: Array.isArray(loaded.unlockedAreas) && loaded.unlockedAreas.length > 0
        ? loaded.unlockedAreas
        : base.unlockedAreas,
      statistics: {
        ...base.statistics,
        ...(loaded.statistics || {})
      }
    };
  }

  // Public getter for the current in-memory save data
  public getSave(): GameSaveData {
    return this.activeSave;
  }

  // Public getter for ShiftStats (used by EconomyManager)
  public getStats(): ShiftStats {
    return this.activeSave.stats;
  }

  public getUpgrades(): VehicleUpgrades {
    return this.activeSave.upgrades;
  }

  public getStatistics(): GameStatistics {
    return this.activeSave.statistics;
  }

  // Update save data and trigger asynchronous storage
  public save(immediate: boolean = false): void {
    this.activeSave.lastSaved = new Date().toISOString();

    const doSave = async () => {
      try {
        if (this.isIndexedDBAvailable && this.db) {
          await this.writeToIndexedDB(this.activeSave);
        }
      } catch (err) {
        console.warn('[SaveManager] IndexedDB save failed, mirroring to localStorage:', err);
      }
      // Always keep a mirror in localStorage fallback for safety
      this.writeToLocalStorageFallback(this.activeSave);
      this.notifyListeners();
    };

    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      doSave();
    } else {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = window.setTimeout(() => {
        this.saveTimeout = null;
        doSave();
      }, 500); // 500ms debounce
    }
  }

  // Flush synchronously before page unload
  private flushImmediateSync(): void {
    this.activeSave.lastSaved = new Date().toISOString();
    this.writeToLocalStorageFallback(this.activeSave);
  }

  // Purchase vehicle upgrade using in-game earnings
  public buyUpgrade(type: 'engine' | 'brakes' | 'tank' | 'decal' | 'horn', value?: any): { success: boolean; messageBangla: string; messageEnglish: string } {
    const stats = this.activeSave.stats;
    const upgrades = this.activeSave.upgrades;

    if (type === 'engine') {
      const nextLevel = upgrades.engineLevel + 1;
      if (nextLevel > 3) {
        return { success: false, messageBangla: 'ইঞ্জিন সর্বোচ্চ লেভেলে আপগ্রেড করা আছে!', messageEnglish: 'Engine is already at maximum level!' };
      }
      const cost = nextLevel === 2 ? 600 : 1200;
      if (stats.cash < cost) {
        return { success: false, messageBangla: `টাকা অপর্যাপ্ত! দরকার ৳${cost}`, messageEnglish: `Insufficient cash! Need ৳${cost}` };
      }
      stats.cash -= cost;
      upgrades.engineLevel = nextLevel;
      this.save(true);
      return { success: true, messageBangla: `ইঞ্জিন টিউনিং লেভেল ${nextLevel} সফল! (+গতি ও অ্যাক্সিলারেশন)`, messageEnglish: `Engine tuned to Level ${nextLevel}! (+Speed & Acceleration)` };
    }

    if (type === 'brakes') {
      const nextLevel = upgrades.brakesLevel + 1;
      if (nextLevel > 3) {
        return { success: false, messageBangla: 'ব্রেক সর্বোচ্চ লেভেলে আপগ্রেড করা আছে!', messageEnglish: 'Brakes already at maximum level!' };
      }
      const cost = nextLevel === 2 ? 400 : 850;
      if (stats.cash < cost) {
        return { success: false, messageBangla: `টাকা অপর্যাপ্ত! দরকার ৳${cost}`, messageEnglish: `Insufficient cash! Need ৳${cost}` };
      }
      stats.cash -= cost;
      upgrades.brakesLevel = nextLevel;
      this.save(true);
      return { success: true, messageBangla: `হাইড্রোলিক ব্রেক লেভেল ${nextLevel} সফল! (+ব্রেকিং পাওয়ার)`, messageEnglish: `Hydraulic brakes upgraded to Level ${nextLevel}!` };
    }

    if (type === 'tank') {
      const nextLevel = upgrades.tankCapacityLevel + 1;
      if (nextLevel > 3) {
        return { success: false, messageBangla: 'সিএনজি গ্যাস সিলিন্ডার সর্বোচ্চ সাইজের!', messageEnglish: 'Gas cylinder already at maximum size!' };
      }
      const cost = nextLevel === 2 ? 500 : 950;
      if (stats.cash < cost) {
        return { success: false, messageBangla: `টাকা অপর্যাপ্ত! দরকার ৳${cost}`, messageEnglish: `Insufficient cash! Need ৳${cost}` };
      }
      stats.cash -= cost;
      upgrades.tankCapacityLevel = nextLevel;
      this.save(true);
      return { success: true, messageBangla: `বড় গ্যাস সিলিন্ডার লেভেল ${nextLevel} স্থাপন সম্পন্ন! (+২৫% গ্যাস ধারণ)`, messageEnglish: `CNG gas cylinder upgraded to Level ${nextLevel}!` };
    }

    if (type === 'decal' && typeof value === 'string') {
      const cost = 250;
      if (upgrades.bodyDecal === value) {
        return { success: false, messageBangla: 'এই ডেকোরেশন ইতিমধ্যে লাগানো আছে!', messageEnglish: 'This decal is already applied!' };
      }
      if (stats.cash < cost) {
        return { success: false, messageBangla: `টাকা অপর্যাপ্ত! দরকার ৳${cost}`, messageEnglish: `Insufficient cash! Need ৳${cost}` };
      }
      stats.cash -= cost;
      upgrades.bodyDecal = value as VehicleUpgrades['bodyDecal'];
      this.save(true);
      return { success: true, messageBangla: `সিএনজি ডেকোরেশন '${value}' লাগানো হয়েছে!`, messageEnglish: `CNG decal '${value}' applied!` };
    }

    return { success: false, messageBangla: 'অজানা আপগ্রেড অনুরোধ', messageEnglish: 'Unknown upgrade request' };
  }

  // Export save data to JSON string
  public exportSaveJson(): string {
    return JSON.stringify(this.activeSave, null, 2);
  }

  // Trigger browser download of save file
  public downloadSaveBackup(): void {
    const jsonStr = this.exportSaveJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);

    const a = document.createElement('a');
    a.href = url;
    a.download = `cng_wala_save_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import save data from JSON string
  public async importSaveJson(jsonString: string): Promise<{ success: boolean; messageBangla: string; messageEnglish: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON root format');
      }
      if (!parsed.stats || typeof parsed.stats.cash !== 'number') {
        throw new Error('Invalid save structure: missing stats');
      }

      this.activeSave = this.migrateAndValidate(parsed);
      await this.save(true);

      return {
        success: true,
        messageBangla: 'সেভ ফাইল সফলভাবে ইম্পোর্ট ও লোড হয়েছে!',
        messageEnglish: 'Save file imported and loaded successfully!'
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        messageBangla: `সেভ ফাইল পড়া সম্ভব হয়নি: ${msg}`,
        messageEnglish: `Failed to import save file: ${msg}`
      };
    }
  }

  // Reset progress back to factory defaults
  public async resetAllProgress(): Promise<void> {
    this.activeSave = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.activeSave.lastSaved = new Date().toISOString();
    await this.save(true);
  }

  // Register listener for save updates
  public subscribe(callback: (save: GameSaveData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.activeSave);
      } catch {
        // Ignore listener error
      }
    }
  }

  // Device-specific notice banner copy
  public static getDeviceStorageNotice(): { bangla: string; english: string } {
    return {
      bangla: '📌 গুরুত্বপূর্ণ তথ্য: আপনার গেমের সকল প্রগ্রেস ব্রাউজারের IndexedDB তে সম্পূর্ণ অফলাইনে সংরক্ষিত থাকে। কোনো এক্সটার্নাল ডাটাবেজে ডাটা যায় না। এটি ডিভাইস-নির্দিষ্ট; অন্য ডিভাইসে খেলতে "এক্সপোর্ট ফাইল" ব্যবহার করুন।',
      english: '📌 Notice: Your game saves are stored locally in your browser\'s IndexedDB. No external database is used. Saves are device-specific and do not automatically sync between computers. Use Export Save to transfer your progress.'
    };
  }
}
