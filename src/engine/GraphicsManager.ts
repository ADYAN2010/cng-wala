// Advanced Adaptive Graphics Management, Hardware Detection, and DRS Engine
import * as THREE from 'three';
import {
  GraphicsPreset,
  GraphicsProfileSettings,
  HardwareCapabilities,
  ShadowQuality,
  TextureQuality,
  ViewDistance,
  DensityLevel
} from '../types';

export class GraphicsManager {
  private static instance: GraphicsManager | null = null;
  public static readonly STORAGE_KEY = 'cng_wala_graphics_config_v1';

  public capabilities!: HardwareCapabilities;
  public settings!: GraphicsProfileSettings;

  // Active runtime state
  public effectiveResolutionScale: number = 1.0;
  public currentFps: number = 60;
  public avgFrameTimeMs: number = 16.6;
  public activeChunksCount: number = 0;
  public activeVehiclesCount: number = 0;

  // Performance monitoring & scaling
  private frameTimes: number[] = [];
  private lastAdjustmentTime: number = 0;
  private consecutiveDropCount: number = 0;
  private consecutiveBoostCount: number = 0;
  private lastFrameTimestamp: number = 0;

  // Developer overlay
  private devOverlayEl: HTMLElement | null = null;
  private lastOverlayUpdate: number = 0;

  // Renderer reference
  private renderer: THREE.WebGLRenderer | null = null;
  private onSettingsChangedListeners: Array<(settings: GraphicsProfileSettings) => void> = [];

  constructor() {
    this.detectHardware();
    this.loadSavedSettings();
    this.initDevOverlay();
  }

  public static getInstance(): GraphicsManager {
    if (!this.instance) {
      this.instance = new GraphicsManager();
    }
    return this.instance;
  }

  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.applySettings(this.settings, false);
  }

  public addChangeListener(listener: (settings: GraphicsProfileSettings) => void): void {
    this.onSettingsChangedListeners.push(listener);
  }

  // 1. Hardware Detection & Real-World Micro-Benchmark
  public detectHardware(): HardwareCapabilities {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemoryGb = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;

    let rendererString = 'Generic WebGL';
    let vendorString = 'Generic Vendor';
    let maxTextureSize = 4096;

    // Test WebGL context & capabilities
    try {
      const testCanvas = document.createElement('canvas');
      const gl = (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const unmaskedR = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          const unmaskedV = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          if (unmaskedR) rendererString = String(unmaskedR);
          if (unmaskedV) vendorString = String(unmaskedV);
        } else {
          const r = gl.getParameter(gl.RENDERER);
          if (r) rendererString = String(r);
        }
      }
    } catch {
      // Graceful fallback
    }

    rendererString = String(rendererString || 'Generic WebGL');
    vendorString = String(vendorString || 'Generic Vendor');

    // Micro-benchmark score (0-100)
    const benchmarkScore = this.runMicroBenchmark();

    // Multi-signal evaluation for recommended preset
    let recommendedPreset: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    const lowerRenderer = rendererString.toLowerCase();

    const isHighEndGpu = /rtx|radeon rx (6|7|8|9)|gtx 10[7-8]0|gtx 1660|apple m[1-4]|geforce rtx/i.test(lowerRenderer);
    const isLowEndGpu = /intel hd|intel uhd|mali-4|mali-t|adreno (3|4|5|61)|powervr|llvmpipe|swiftshader|microsoft basic/i.test(lowerRenderer);

    if (isLowEndGpu || isMobile || benchmarkScore < 35 || maxTextureSize < 4096 || deviceMemoryGb <= 2) {
      recommendedPreset = 'low';
    } else if (isHighEndGpu && benchmarkScore >= 75 && deviceMemoryGb >= 8 && hardwareConcurrency >= 8 && !isMobile) {
      recommendedPreset = 'ultra';
    } else if (benchmarkScore >= 55 && !isMobile) {
      recommendedPreset = 'high';
    } else {
      recommendedPreset = 'medium';
    }

    this.capabilities = {
      rendererString,
      vendorString,
      isMobile,
      devicePixelRatio,
      maxTextureSize,
      deviceMemoryGb,
      hardwareConcurrency,
      benchmarkScore,
      recommendedPreset
    };

    return this.capabilities;
  }

  // Quick 10-ms Fillrate and Draw Micro-Benchmark
  private runMicroBenchmark(): number {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (!gl) return 20;

      const t0 = performance.now();
      gl.clearColor(0.2, 0.4, 0.6, 1.0);

      // Perform 30 rapid buffer operations
      for (let i = 0; i < 30; i++) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.finish();
      }
      const elapsed = performance.now() - t0;

      // Faster execution => higher score
      if (elapsed < 3) return 90;
      if (elapsed < 6) return 75;
      if (elapsed < 12) return 55;
      if (elapsed < 25) return 40;
      return 25;
    } catch {
      return 35;
    }
  }

  // 2. Preset Definitions
  public getPresetSettings(preset: GraphicsPreset): GraphicsProfileSettings {
    const base: GraphicsProfileSettings = {
      preset,
      resolutionScale: 1.0,
      shadowQuality: 'medium',
      textureQuality: 'high',
      viewDistance: 'high',
      environmentDetail: 'high',
      trafficDensity: 'high',
      pedestrianDensity: 'high',
      vegetationDensity: 'high',
      waterQuality: 'high',
      weatherParticles: 'high',
      antiAliasing: true,
      targetFpsLimit: 60,
      autoOptimization: true,
      showDevOverlay: false
    };

    if (preset === 'auto') {
      return this.getPresetSettings(this.capabilities.recommendedPreset);
    }

    switch (preset) {
      case 'low':
        return {
          ...base,
          preset: 'low',
          resolutionScale: 0.65,
          shadowQuality: 'off',
          textureQuality: 'low',
          viewDistance: 'low',
          environmentDetail: 'low',
          trafficDensity: 'low',
          pedestrianDensity: 'low',
          vegetationDensity: 'low',
          waterQuality: 'low',
          weatherParticles: 'low',
          antiAliasing: false,
          targetFpsLimit: 30,
          autoOptimization: true
        };
      case 'medium':
        return {
          ...base,
          preset: 'medium',
          resolutionScale: 0.80,
          shadowQuality: 'low',
          textureQuality: 'medium',
          viewDistance: 'medium',
          environmentDetail: 'medium',
          trafficDensity: 'medium',
          pedestrianDensity: 'medium',
          vegetationDensity: 'medium',
          waterQuality: 'low',
          weatherParticles: 'medium',
          antiAliasing: true,
          targetFpsLimit: 60,
          autoOptimization: true
        };
      case 'high':
        return {
          ...base,
          preset: 'high',
          resolutionScale: 1.0,
          shadowQuality: 'medium',
          textureQuality: 'high',
          viewDistance: 'high',
          environmentDetail: 'high',
          trafficDensity: 'high',
          pedestrianDensity: 'high',
          vegetationDensity: 'high',
          waterQuality: 'high',
          weatherParticles: 'high',
          antiAliasing: true,
          targetFpsLimit: 60,
          autoOptimization: true
        };
      case 'ultra':
        return {
          ...base,
          preset: 'ultra',
          resolutionScale: 1.0,
          shadowQuality: 'high',
          textureQuality: 'high',
          viewDistance: 'ultra',
          environmentDetail: 'high',
          trafficDensity: 'high',
          pedestrianDensity: 'high',
          vegetationDensity: 'high',
          waterQuality: 'high',
          weatherParticles: 'high',
          antiAliasing: true,
          targetFpsLimit: 0, // unlimited
          autoOptimization: true
        };
      case 'custom':
      default:
        return this.settings || base;
    }
  }

  // Load and apply saved configuration
  public loadSavedSettings(): void {
    let loaded: Partial<GraphicsProfileSettings> | null = null;
    try {
      const raw = localStorage.getItem(GraphicsManager.STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch {
      // Local storage unreadable
    }

    if (loaded && loaded.preset) {
      if (loaded.preset === 'custom') {
        this.settings = { ...this.getPresetSettings('medium'), ...loaded };
      } else {
        this.settings = this.getPresetSettings(loaded.preset);
        if (loaded.showDevOverlay !== undefined) {
          this.settings.showDevOverlay = loaded.showDevOverlay;
        }
      }
    } else {
      // Default to Auto based on detected hardware
      const rec = this.capabilities.recommendedPreset;
      this.settings = { ...this.getPresetSettings(rec), preset: 'auto' };
    }

    this.effectiveResolutionScale = this.settings.resolutionScale;
  }

  public saveSettings(): void {
    try {
      localStorage.setItem(GraphicsManager.STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Local storage quota exceeded or disabled
    }
  }

  public setPreset(preset: GraphicsPreset): void {
    if (preset === 'custom') {
      this.settings.preset = 'custom';
    } else {
      this.settings = this.getPresetSettings(preset);
      if (preset === 'auto') {
        this.settings.preset = 'auto';
      }
    }
    this.effectiveResolutionScale = this.settings.resolutionScale;
    this.applySettings(this.settings);
    this.saveSettings();
  }

  public updateSetting<K extends keyof GraphicsProfileSettings>(key: K, value: GraphicsProfileSettings[K]): void {
    this.settings[key] = value;
    this.settings.preset = 'custom';
    if (key === 'resolutionScale') {
      this.effectiveResolutionScale = value as number;
    }
    this.applySettings(this.settings);
    this.saveSettings();
  }

  public restoreDefaults(): void {
    const rec = this.capabilities.recommendedPreset;
    this.settings = { ...this.getPresetSettings(rec), preset: 'auto' };
    this.effectiveResolutionScale = this.settings.resolutionScale;
    this.applySettings(this.settings);
    this.saveSettings();
  }

  // Apply graphics settings to renderer and systems
  public applySettings(settings: GraphicsProfileSettings, triggerCallbacks: boolean = true): void {
    if (this.renderer) {
      this.applyRendererScale();

      // Shadow map settings
      if (settings.shadowQuality === 'off') {
        this.renderer.shadowMap.enabled = false;
      } else {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = settings.shadowQuality === 'high' 
          ? THREE.PCFSoftShadowMap 
          : THREE.BasicShadowMap;
      }
    }

    // Toggle Dev Overlay visibility
    if (this.devOverlayEl) {
      this.devOverlayEl.classList.toggle('hidden', !settings.showDevOverlay);
    }

    if (triggerCallbacks) {
      for (const listener of this.onSettingsChangedListeners) {
        try {
          listener(settings);
        } catch (err) {
          console.warn('[GraphicsManager] Error in settings listener:', err);
        }
      }
    }
  }

  // 3. Dynamic Resolution Scaling (DRS)
  public applyRendererScale(): void {
    if (!this.renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = this.effectiveResolutionScale;

    // Use updateStyle = false so canvas CSS remains 100vw x 100vh, perfectly scaling buffer
    const renderWidth = Math.floor(width * scale);
    const renderHeight = Math.floor(height * scale);

    this.renderer.setSize(renderWidth, renderHeight, false);
    this.renderer.domElement.style.width = '100vw';
    this.renderer.domElement.style.height = '100vh';
  }

  // 4. Per-Frame Performance Monitoring & Automatic Dynamic Scaling
  public updatePerformance(timestamp: number): boolean {
    // Frame pacing / FPS limiter
    if (this.settings.targetFpsLimit > 0) {
      const minInterval = 1000 / (this.settings.targetFpsLimit + 1);
      const elapsed = timestamp - this.lastFrameTimestamp;
      if (elapsed < minInterval) {
        return false; // Skip this frame to maintain target FPS
      }
    }

    const delta = this.lastFrameTimestamp > 0 ? (timestamp - this.lastFrameTimestamp) : 16.6;
    this.lastFrameTimestamp = timestamp;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    this.avgFrameTimeMs = sum / this.frameTimes.length;
    this.currentFps = Math.round(1000 / Math.max(this.avgFrameTimeMs, 1));

    // Dynamic quality & DRS scaling (if autoOptimization is enabled)
    if (this.settings.autoOptimization && timestamp - this.lastAdjustmentTime > 5000) {
      this.evaluateAdaptiveScaling(timestamp);
    }

    // Update dev overlay if enabled
    if (this.settings.showDevOverlay && timestamp - this.lastOverlayUpdate > 250) {
      this.updateDevOverlayUI();
      this.lastOverlayUpdate = timestamp;
    }

    return true;
  }

  private evaluateAdaptiveScaling(timestamp: number): void {
    const targetFps = this.settings.targetFpsLimit > 0 ? this.settings.targetFpsLimit : 60;
    const dropThreshold = targetFps <= 30 ? 24 : (targetFps <= 45 ? 36 : 48);
    const boostThreshold = targetFps <= 30 ? 29 : (targetFps <= 45 ? 44 : 57);

    // Frame drop check (underperforming)
    if (this.currentFps < dropThreshold) {
      this.consecutiveDropCount++;
      this.consecutiveBoostCount = 0;

      if (this.consecutiveDropCount >= 2) {
        this.stepDownQuality();
        this.lastAdjustmentTime = timestamp;
        this.consecutiveDropCount = 0;
      }
    } else if (this.currentFps >= boostThreshold) {
      this.consecutiveBoostCount++;
      this.consecutiveDropCount = 0;

      if (this.consecutiveBoostCount >= 3) {
        this.stepUpQuality();
        this.lastAdjustmentTime = timestamp;
        this.consecutiveBoostCount = 0;
      }
    } else {
      this.consecutiveDropCount = 0;
      this.consecutiveBoostCount = 0;
    }
  }

  private stepDownQuality(): void {
    // 1. First step down Dynamic Resolution Scale
    if (this.effectiveResolutionScale > 0.55) {
      this.effectiveResolutionScale = Math.max(0.55, Number((this.effectiveResolutionScale - 0.08).toFixed(2)));
      this.applyRendererScale();
      return;
    }

    // 2. If DRS is already at minimum, step down heavy visual features
    if (this.settings.shadowQuality !== 'off') {
      this.settings.shadowQuality = this.settings.shadowQuality === 'high' ? 'medium' : (this.settings.shadowQuality === 'medium' ? 'low' : 'off');
      this.applySettings(this.settings);
    } else if (this.settings.viewDistance !== 'low') {
      this.settings.viewDistance = this.settings.viewDistance === 'ultra' ? 'high' : (this.settings.viewDistance === 'high' ? 'medium' : 'low');
      this.applySettings(this.settings);
    }
  }

  private stepUpQuality(): void {
    const maxScale = this.settings.preset === 'low' ? 0.75 : (this.settings.preset === 'medium' ? 0.90 : 1.0);
    if (this.effectiveResolutionScale < maxScale) {
      this.effectiveResolutionScale = Math.min(maxScale, Number((this.effectiveResolutionScale + 0.05).toFixed(2)));
      this.applyRendererScale();
    }
  }

  // 5. Developer Performance Overlay
  private initDevOverlay(): void {
    this.devOverlayEl = document.createElement('div');
    this.devOverlayEl.id = 'cng-dev-overlay';
    this.devOverlayEl.className = 'dev-overlay-panel hidden';
    document.body.appendChild(this.devOverlayEl);
  }

  private updateDevOverlayUI(): void {
    if (!this.devOverlayEl || !this.renderer) return;

    const info = this.renderer.info;
    const calls = info.render.calls;
    const triangles = info.render.triangles;
    const textures = info.memory.textures;
    const geometries = info.memory.geometries;

    this.devOverlayEl.innerHTML = `
      <div class="dev-overlay-header">⚡ CNG DEV PERFORMANCE</div>
      <div class="dev-overlay-grid">
        <span class="dev-label">FPS:</span>
        <span class="dev-val ${this.currentFps < 30 ? 'dev-warn' : 'dev-good'}">${this.currentFps} FPS (${this.avgFrameTimeMs.toFixed(1)}ms)</span>

        <span class="dev-label">Preset / DRS:</span>
        <span class="dev-val">${this.settings.preset.toUpperCase()} (${Math.round(this.effectiveResolutionScale * 100)}%)</span>

        <span class="dev-label">Draw Calls:</span>
        <span class="dev-val ${calls > 150 ? 'dev-warn' : 'dev-good'}">${calls}</span>

        <span class="dev-label">Triangles:</span>
        <span class="dev-val">${triangles.toLocaleString()}</span>

        <span class="dev-label">Active Chunks:</span>
        <span class="dev-val">${this.activeChunksCount}</span>

        <span class="dev-label">Traffic Agents:</span>
        <span class="dev-val">${this.activeVehiclesCount}</span>

        <span class="dev-label">Textures / Geos:</span>
        <span class="dev-val">${textures} tex / ${geometries} geo</span>

        <span class="dev-label">GPU:</span>
        <span class="dev-val dev-small">${this.capabilities.rendererString.slice(0, 32)}</span>
      </div>
    `;
  }
}
