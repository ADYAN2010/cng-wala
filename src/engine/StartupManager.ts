// Robust Game Engine Startup Orchestrator & Error Boundary
import { GameEngine } from './GameEngine';
import { GraphicsManager } from './GraphicsManager';
import { SaveManager } from '../storage/SaveManager';

export class StartupManager {
  private static instance: StartupManager | null = null;
  private engine: GameEngine | null = null;
  private splashEl: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;
  private progressBarEl: HTMLElement | null = null;
  private progressTextEl: HTMLElement | null = null;

  public static getInstance(): StartupManager {
    if (!this.instance) {
      this.instance = new StartupManager();
    }
    return this.instance;
  }

  public async bootstrap(): Promise<void> {
    this.cacheDOMElements();

    try {
      // Step 1: Check WebGL Support
      this.updateProgress(15, '১. গেম শেল ও সিস্টেম লোড হচ্ছে... (Loading game shell)');
      await this.sleep(60);

      const webglSupported = this.checkWebGLSupport();
      if (!webglSupported) {
        this.showCriticalError(
          'WebGL নট সাপোর্টেড (WebGL Not Supported)',
          'আপনার ব্রাউজার বা ডিভাইসে WebGL 3D গ্রাফিক্স চালু নেই বা অ্যাক্সিলারেশন বন্ধ রয়েছে।',
          'সমাধান: ব্রাউজার সেটিংসে গিয়ে "Use hardware acceleration when available" চালু করুন এবং ব্রাউজার রিস্টার্ট করুন।'
        );
        return;
      }

      // Step 2: Detect Hardware & Benchmark
      this.updateProgress(35, '২. হার্ডওয়্যার ক্ষমতা ও গ্রাফিক্স প্রোফাইল পরীক্ষা... (Detecting capabilities)');
      await this.sleep(70);

      const gm = GraphicsManager.getInstance();
      const caps = gm.capabilities;
      console.log(`[StartupManager] Detected GPU: ${caps.rendererString} | Recommended Preset: ${caps.recommendedPreset}`);

      // Step 3: Load Player Save & Local Progress (Database-Free IndexedDB)
      this.updateProgress(55, '৩. গেম প্রগ্রেস ও সেভ ডাটা লোড হচ্ছে... (Loading saved progress)');
      await SaveManager.getInstance().init();
      await this.sleep(40);

      // Step 4: Load Essential Engine Shell
      this.updateProgress(75, '৪. গেম ইঞ্জিন ও কোর লাইব্রেরি প্রস্তুত... (Initializing 3D engine)');
      await this.sleep(60);

      this.engine = new GameEngine();
      (window as unknown as { __CNG_GAME_ENGINE__: GameEngine }).__CNG_GAME_ENGINE__ = this.engine;

      // Step 5: Ready Main Menu
      this.updateProgress(90, '৫. ধানমন্ডি মেইন মেনু প্রস্তুত... (Ready)');
      await this.sleep(60);

      this.updateProgress(100, 'সম্পূর্ণ প্রস্তুত! (Complete)');
      await this.sleep(120);

      this.hideSplash();
    } catch (err: unknown) {
      console.error('[StartupManager] Critical startup error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      this.showCriticalError(
        'স্টার্টআপ সমস্যা (Startup Error)',
        'গেম ইঞ্জিন চালু করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
        `কারিগরি বিবরণ: ${msg}`
      );
    }
  }

  // Safe WebGL support test
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      if (gl2) return true;

      const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl1;
    } catch {
      return false;
    }
  }

  private cacheDOMElements(): void {
    this.splashEl = document.getElementById('cng-startup-splash');
    this.errorEl = document.getElementById('cng-startup-error');
    this.progressBarEl = document.getElementById('startup-progress-bar');
    this.progressTextEl = document.getElementById('startup-progress-text');
  }

  private updateProgress(percent: number, message: string): void {
    if (this.progressBarEl) {
      this.progressBarEl.style.width = `${percent}%`;
    }
    if (this.progressTextEl) {
      this.progressTextEl.textContent = message;
    }
  }

  private hideSplash(): void {
    if (this.splashEl) {
      this.splashEl.classList.add('fade-out');
      setTimeout(() => {
        if (this.splashEl) this.splashEl.style.display = 'none';
      }, 400);
    }
  }

  private showCriticalError(title: string, summary: string, details: string): void {
    if (this.splashEl) {
      this.splashEl.style.display = 'none';
    }

    if (this.errorEl) {
      this.errorEl.classList.remove('hidden');
      const titleEl = document.getElementById('error-title');
      const sumEl = document.getElementById('error-summary');
      const detEl = document.getElementById('error-details');
      const retryBtn = document.getElementById('btn-retry-startup');

      if (titleEl) titleEl.textContent = title;
      if (sumEl) sumEl.textContent = summary;
      if (detEl) detEl.textContent = details;

      retryBtn?.addEventListener('click', () => {
        window.location.reload();
      }, { once: true });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
