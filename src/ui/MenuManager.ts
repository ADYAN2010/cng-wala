// Game Start Screen, Pause Menu, Adaptive Graphics & Audio Settings Modal
import { AudioManager } from '../engine/AudioManager';
import { GraphicsManager } from '../engine/GraphicsManager';
import { SaveManager } from '../storage/SaveManager';
import { GraphicsPreset, ShadowQuality, TextureQuality, ViewDistance, DensityLevel } from '../types';

export class MenuManager {
  private startMenuEl!: HTMLElement;
  private pauseMenuEl!: HTMLElement;
  private modalEl!: HTMLElement;
  private audioManager: AudioManager;
  private graphicsManager: GraphicsManager;
  private saveManager: SaveManager;

  public isGameStarted: boolean = false;
  public isPaused: boolean = false;

  // Callbacks
  public onStartGame: (() => void) | null = null;
  public onResumeGame: (() => void) | null = null;
  public onRestartShift: (() => void) | null = null;
  public onWeatherToggle: (() => void) | null = null;

  // Real-time diagnostics ticker
  private statsInterval: number | null = null;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.graphicsManager = GraphicsManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.createMenus();
    this.bindEvents();
  }

  private createMenus(): void {
    const root = document.createElement('div');
    root.id = 'menu-root';
    root.innerHTML = `
      <!-- Professional Start Screen -->
      <div id="start-menu" class="menu-overlay">
        <div class="menu-box start-box">
          <div class="title-badge">DHAKA OPEN-WORLD SIMULATOR</div>
          <h1 class="game-title">CNG WALA</h1>
          <h2 class="game-subtitle">Dhanmondi Shift — Life on Dhaka Streets</h2>
          
          <div class="menu-nav">
            <button id="btn-start" class="menu-btn primary-btn">🛺 START DRIVING (গাড়ি চালান)</button>
            <button id="btn-save-progress" class="menu-btn secondary-btn">💾 SAVE & PROGRESS (গেম সেভ ও গ্যারেজ)</button>
            <button id="btn-how-to-play" class="menu-btn secondary-btn">📖 HOW TO PLAY (কীভাবে খেলবেন)</button>
            <button id="btn-settings" class="menu-btn secondary-btn">⚙️ SETTINGS (গ্রাফিক্স ও অডিও)</button>
            <button id="btn-about" class="menu-btn secondary-btn">ℹ️ ABOUT (পরিচিতি)</button>
          </div>

          <div class="menu-hardware-badge">
            <span id="detected-hw-pill">⚡ Profile: ${this.graphicsManager.settings.preset.toUpperCase()} (${this.graphicsManager.capabilities.recommendedPreset.toUpperCase()} Detected)</span>
          </div>

          <div class="menu-footer">
            <span>Authentic Dhaka Streets • Bangla Dialogue • Adaptive 3D Engine</span>
          </div>
        </div>
      </div>

      <!-- In-Game Pause Menu -->
      <div id="pause-menu" class="menu-overlay hidden">
        <div class="menu-box pause-box">
          <h2 class="pause-title">SHIFT PAUSED (বিরতি)</h2>
          <div class="menu-nav">
            <button id="btn-resume" class="menu-btn primary-btn">▶ RESUME SHIFT (চালিয়ে যান)</button>
            <button id="btn-pause-save" class="menu-btn secondary-btn">💾 SAVE & PROGRESS (গেম সেভ ও ব্যাকআপ)</button>
            <button id="btn-pause-weather" class="menu-btn secondary-btn">🌧 TOGGLE MONSOON RAIN (বৃষ্টি)</button>
            <button id="btn-pause-settings" class="menu-btn secondary-btn">⚙️ GRAPHICS & AUDIO SETTINGS (সেটিংস)</button>
            <button id="btn-restart" class="menu-btn secondary-btn">🔄 RESTART SHIFT (নতুন শিফট)</button>
          </div>
        </div>
      </div>

      <!-- General Info & Settings Modal -->
      <div id="info-modal" class="menu-overlay hidden">
        <div class="menu-box modal-box">
          <div class="modal-header">
            <h3 id="modal-title" class="modal-heading">SETTINGS</h3>
            <button id="btn-modal-close" class="close-btn">✕</button>
          </div>
          <div id="modal-content" class="modal-body"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    this.startMenuEl = document.getElementById('start-menu')!;
    this.pauseMenuEl = document.getElementById('pause-menu')!;
    this.modalEl = document.getElementById('info-modal')!;
  }

  private bindEvents(): void {
    // Start button
    document.getElementById('btn-start')?.addEventListener('click', () => {
      try {
        this.audioManager.ensureContext();
      } catch (err) {
        console.warn('Audio start error ignored:', err);
      }
      this.startMenuEl.classList.add('hidden');
      this.isGameStarted = true;
      if (this.onStartGame) this.onStartGame();
    });

    // How to Play
    document.getElementById('btn-how-to-play')?.addEventListener('click', () => {
      this.showModal('HOW TO PLAY (কীভাবে খেলবেন)', `
        <div class="guide-section">
          <h4>🎮 CONTROLS (নিয়ন্ত্রণ):</h4>
          <ul>
            <li><strong>W / UP ARROW:</strong> Accelerate (গ্যাস / গতি)</li>
            <li><strong>S / DOWN ARROW:</strong> Brake / Reverse (ব্রেক / পিছিয়ে যাওয়া)</li>
            <li><strong>A / LEFT ARROW:</strong> Steer Left (বামে মোড়)</li>
            <li><strong>D / RIGHT ARROW:</strong> Steer Right (ডানে মোড়)</li>
            <li><strong>SPACEBAR:</strong> Handbrake (হ্যান্ডব্রেক)</li>
            <li><strong>H:</strong> Dhaka CNG Horn (হর্ন - পী-পীপ!)</li>
            <li><strong>L:</strong> Headlights Toggle (হেডলাইট)</li>
            <li><strong>E:</strong> Talk to Passenger / Bargain (যাত্রীর সাথে কথা বলুন)</li>
            <li><strong>C:</strong> Change Camera View (ক্যামেরা পরিবর্তন - Chase / Cockpit / Action)</li>
            <li><strong>ESC:</strong> Pause Menu / Graphics Settings (বিরতি ও সেটিংস)</li>
          </ul>
        </div>
        <div class="guide-section">
          <h4>🛺 DAILY SHIFT GOALS:</h4>
          <p>Drive around Dhanmondi, spot passengers waiting on sidewalks, stop near them (< 6m) and bargain fare in natural Dhaka Bangla. Complete trips to earn enough for the ৳ 800 CNG daily owner rental (জমা) and take home your profit!</p>
        </div>
      `);
    });

    // Save & Progress modal
    const showSaveProgress = () => {
      this.renderSaveModal();
    };

    document.getElementById('btn-save-progress')?.addEventListener('click', showSaveProgress);
    document.getElementById('btn-pause-save')?.addEventListener('click', showSaveProgress);

    // Settings
    const showSettings = () => {
      this.renderSettingsModal();
    };

    document.getElementById('btn-settings')?.addEventListener('click', showSettings);
    document.getElementById('btn-pause-settings')?.addEventListener('click', showSettings);

    // About
    document.getElementById('btn-about')?.addEventListener('click', () => {
      this.showModal('ABOUT (পরিচিতি)', `
        <p><strong>CNG WALA — DHANMONDI SHIFT</strong></p>
        <p>A realistic open-world Bangladeshi CNG driving simulator featuring full Dhanmondi coverage: Satmasjid Road, Dhanmondi Lake, Rabindra Sarobar, Dhaka Metro Rail viaduct, local buses, cycle rickshaws, and colloquial Dhaka Bangla fare negotiations.</p>
        <p>Engineered with Adaptive Graphics, Dynamic Resolution Scaling (DRS), fixed 60Hz physics, and procedural WebGL/WebAudio synthesis.</p>
      `);
    });

    // Resume button
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.hidePauseMenu();
      if (this.onResumeGame) this.onResumeGame();
    });

    // Toggle Weather
    document.getElementById('btn-pause-weather')?.addEventListener('click', () => {
      if (this.onWeatherToggle) this.onWeatherToggle();
    });

    // Restart button
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.hidePauseMenu();
      if (this.onRestartShift) this.onRestartShift();
    });

    // Close modal
    document.getElementById('btn-modal-close')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Escape key for pause toggle
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isGameStarted) {
        if (!this.modalEl.classList.contains('hidden')) {
          this.closeModal();
        } else if (this.isPaused) {
          this.hidePauseMenu();
          if (this.onResumeGame) this.onResumeGame();
        } else {
          this.showPauseMenu();
        }
      }
    });
  }

  // Render Full Professional Graphics & Performance Settings
  private renderSettingsModal(): void {
    const s = this.graphicsManager.settings;
    const caps = this.graphicsManager.capabilities;

    const html = `
      <div class="settings-container">
        <!-- Live Diagnostics Bar -->
        <div class="live-diagnostics-bar">
          <div class="diag-item">FPS: <strong id="diag-fps">${this.graphicsManager.currentFps}</strong></div>
          <div class="diag-item">Frame Time: <strong id="diag-ms">${this.graphicsManager.avgFrameTimeMs.toFixed(1)} ms</strong></div>
          <div class="diag-item">Render Scale: <strong id="diag-res">${Math.round(this.graphicsManager.effectiveResolutionScale * 100)}%</strong></div>
          <div class="diag-item">Auto-Scale: <span class="badge-${s.autoOptimization ? 'active' : 'warn'}">${s.autoOptimization ? 'ACTIVE' : 'LOCKED'}</span></div>
        </div>

        <div class="settings-tabs">
          <div class="settings-group">
            <label class="setting-title">🎮 GRAPHICS PRESET (গ্রাফিক্স মান):</label>
            <div class="preset-selector-row">
              <button class="preset-btn ${s.preset === 'auto' ? 'selected' : ''}" data-preset="auto">AUTO (${caps.recommendedPreset.toUpperCase()})</button>
              <button class="preset-btn ${s.preset === 'low' ? 'selected' : ''}" data-preset="low">LOW (কম্পিউটার হালকা)</button>
              <button class="preset-btn ${s.preset === 'medium' ? 'selected' : ''}" data-preset="medium">MEDIUM (মাঝারি)</button>
              <button class="preset-btn ${s.preset === 'high' ? 'selected' : ''}" data-preset="high">HIGH (উচ্চ)</button>
              <button class="preset-btn ${s.preset === 'ultra' ? 'selected' : ''}" data-preset="ultra">ULTRA (গেমিং)</button>
            </div>
          </div>

          <div class="settings-grid">
            <div class="setting-cell">
              <label>Internal Resolution Scale (DRS): <span id="res-scale-val">${Math.round(s.resolutionScale * 100)}%</span></label>
              <input id="setting-res-scale" type="range" min="50" max="100" step="5" value="${Math.round(s.resolutionScale * 100)}" class="slider" />
            </div>

            <div class="setting-cell">
              <label>Target FPS Limit (ফ্রেমরেট সীমা):</label>
              <select id="setting-fps-limit" class="setting-select">
                <option value="30" ${s.targetFpsLimit === 30 ? 'selected' : ''}>30 FPS (Power Saver / Low-End)</option>
                <option value="45" ${s.targetFpsLimit === 45 ? 'selected' : ''}>45 FPS</option>
                <option value="60" ${s.targetFpsLimit === 60 ? 'selected' : ''}>60 FPS (Recommended)</option>
                <option value="90" ${s.targetFpsLimit === 90 ? 'selected' : ''}>90 FPS</option>
                <option value="120" ${s.targetFpsLimit === 120 ? 'selected' : ''}>120 FPS</option>
                <option value="0" ${s.targetFpsLimit === 0 ? 'selected' : ''}>Unlimited (সর্বোচ্চ)</option>
              </select>
            </div>

            <div class="setting-cell">
              <label>Shadow Quality (ছায়া):</label>
              <select id="setting-shadows" class="setting-select">
                <option value="off" ${s.shadowQuality === 'off' ? 'selected' : ''}>Disabled (বন্ধ - দ্রুততম)</option>
                <option value="low" ${s.shadowQuality === 'low' ? 'selected' : ''}>Low (সাধারণ ছায়া)</option>
                <option value="medium" ${s.shadowQuality === 'medium' ? 'selected' : ''}>Medium (উন্নত ছায়া)</option>
                <option value="high" ${s.shadowQuality === 'high' ? 'selected' : ''}>High (সফট ফিল্টার)</option>
              </select>
            </div>

            <div class="setting-cell">
              <label>View Distance (দূরত্ব লোড):</label>
              <select id="setting-view-dist" class="setting-select">
                <option value="low" ${s.viewDistance === 'low' ? 'selected' : ''}>Low (80m - হালকা)</option>
                <option value="medium" ${s.viewDistance === 'medium' ? 'selected' : ''}>Medium (160m)</option>
                <option value="high" ${s.viewDistance === 'high' ? 'selected' : ''}>High (260m)</option>
                <option value="ultra" ${s.viewDistance === 'ultra' ? 'selected' : ''}>Ultra (360m - সম্পূর্ণ ধানমন্ডি)</option>
              </select>
            </div>

            <div class="setting-cell">
              <label>Traffic Density (রাস্তায় যানবাহন):</label>
              <select id="setting-traffic-density" class="setting-select">
                <option value="low" ${s.trafficDensity === 'low' ? 'selected' : ''}>Low (হালকা ট্রাফিক)</option>
                <option value="medium" ${s.trafficDensity === 'medium' ? 'selected' : ''}>Medium (স্বাভাবিক)</option>
                <option value="high" ${s.trafficDensity === 'high' ? 'selected' : ''}>High (ব্যস্ত ঢাকা ট্রাফিক)</option>
              </select>
            </div>

            <div class="setting-cell">
              <label>Monsoon Rain Particles (বৃষ্টির কণা):</label>
              <select id="setting-weather" class="setting-select">
                <option value="off" ${s.weatherParticles === 'off' ? 'selected' : ''}>Off (বন্ধ)</option>
                <option value="low" ${s.weatherParticles === 'low' ? 'selected' : ''}>Low (500 কণা)</option>
                <option value="medium" ${s.weatherParticles === 'medium' ? 'selected' : ''}>Medium (1500 কণা)</option>
                <option value="high" ${s.weatherParticles === 'high' ? 'selected' : ''}>High (3500 কণা)</option>
              </select>
            </div>
          </div>

          <div class="settings-toggle-row">
            <label class="checkbox-label">
              <input id="setting-auto-opt" type="checkbox" ${s.autoOptimization ? 'checked' : ''} />
              <span>Adaptive Performance Scaling (স্বয়ংক্রিয় ফ্রেম স্থিতিশীলকারী)</span>
            </label>
            <label class="checkbox-label">
              <input id="setting-dev-overlay" type="checkbox" ${s.showDevOverlay ? 'checked' : ''} />
              <span>Developer Performance Overlay (পারফরম্যান্স ওয়ান-স্ক্রিন মিটার)</span>
            </label>
          </div>

          <hr class="settings-divider" />

          <!-- Audio Settings -->
          <div class="audio-settings-row">
            <div class="setting-cell">
              <label>Master Sound Volume (শব্দ):</label>
              <input id="setting-master-vol" type="range" min="0" max="100" value="80" class="slider" />
            </div>
            <div class="setting-cell">
              <label>Bangla Dialogue Volume (বাংলা কণ্ঠস্বর):</label>
              <input id="setting-voice-vol" type="range" min="0" max="100" value="100" class="slider" />
            </div>
          </div>

          <div class="settings-footer-actions">
            <button id="btn-restore-defaults" class="menu-btn secondary-btn small-btn">🔄 Restore Recommended (ডিফল্ট)</button>
            <button id="btn-settings-done" class="menu-btn primary-btn small-btn">✓ Save & Apply (সংরক্ষণ)</button>
          </div>
        </div>
      </div>
    `;

    this.showModal('GRAPHICS & AUDIO SETTINGS (গ্রাফিক্স ও অডিও সেটিংস)', html);
    this.bindSettingsModalEvents();
  }

  private bindSettingsModalEvents(): void {
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const preset = target.getAttribute('data-preset') as GraphicsPreset;
        this.graphicsManager.setPreset(preset);
        this.renderSettingsModal(); // Refresh modal with new values
      });
    });

    // Resolution slider
    const resSlider = document.getElementById('setting-res-scale') as HTMLInputElement;
    resSlider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      const label = document.getElementById('res-scale-val');
      if (label) label.textContent = `${val}%`;
      this.graphicsManager.updateSetting('resolutionScale', val / 100);
    });

    // FPS Limit
    document.getElementById('setting-fps-limit')?.addEventListener('change', (e) => {
      const val = parseInt((e.target as HTMLSelectElement).value, 10);
      this.graphicsManager.updateSetting('targetFpsLimit', val);
    });

    // Shadows
    document.getElementById('setting-shadows')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as ShadowQuality;
      this.graphicsManager.updateSetting('shadowQuality', val);
    });

    // View distance
    document.getElementById('setting-view-dist')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as ViewDistance;
      this.graphicsManager.updateSetting('viewDistance', val);
    });

    // Traffic density
    document.getElementById('setting-traffic-density')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as DensityLevel;
      this.graphicsManager.updateSetting('trafficDensity', val);
    });

    // Weather particles
    document.getElementById('setting-weather')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as 'off' | 'low' | 'medium' | 'high';
      this.graphicsManager.updateSetting('weatherParticles', val);
    });

    // Auto Optimization
    document.getElementById('setting-auto-opt')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.graphicsManager.updateSetting('autoOptimization', checked);
    });

    // Dev Overlay
    document.getElementById('setting-dev-overlay')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.graphicsManager.updateSetting('showDevOverlay', checked);
    });

    // Audio volumes
    document.getElementById('setting-master-vol')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10) / 100;
      this.audioManager.setMasterVolume(val);
    });

    document.getElementById('setting-voice-vol')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10) / 100;
      this.audioManager.setVoiceVolume(val);
    });

    // Restore defaults
    document.getElementById('btn-restore-defaults')?.addEventListener('click', () => {
      this.graphicsManager.restoreDefaults();
      this.renderSettingsModal();
    });

    // Done button
    document.getElementById('btn-settings-done')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Start live diagnostics ticker
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = window.setInterval(() => {
      const fpsEl = document.getElementById('diag-fps');
      const msEl = document.getElementById('diag-ms');
      const resEl = document.getElementById('diag-res');
      if (fpsEl) fpsEl.textContent = `${this.graphicsManager.currentFps}`;
      if (msEl) msEl.textContent = `${this.graphicsManager.avgFrameTimeMs.toFixed(1)} ms`;
      if (resEl) resEl.textContent = `${Math.round(this.graphicsManager.effectiveResolutionScale * 100)}%`;
    }, 400);
  }

  // Render Database-Free Save Management & Vehicle Garage Modal
  private renderSaveModal(): void {
    const save = this.saveManager.getSave();
    const stats = save.stats;
    const statistics = save.statistics;
    const upgrades = save.upgrades;
    const notice = SaveManager.getDeviceStorageNotice();

    let lastSavedFormatted = 'আজকে';
    try {
      lastSavedFormatted = new Date(save.lastSaved).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      lastSavedFormatted = save.lastSaved;
    }

    const engineCost = upgrades.engineLevel === 1 ? 600 : (upgrades.engineLevel === 2 ? 1200 : null);
    const brakesCost = upgrades.brakesLevel === 1 ? 400 : (upgrades.brakesLevel === 2 ? 850 : null);
    const tankCost = upgrades.tankCapacityLevel === 1 ? 500 : (upgrades.tankCapacityLevel === 2 ? 950 : null);

    const html = `
      <div class="save-modal-container">
        <!-- Storage Status Bar -->
        <div class="save-status-bar">
          <div class="save-status-item">
            <span>💾 সেভ ইঞ্জিন:</span>
            <strong class="badge-active">${save.storageBackend === 'indexeddb' ? 'IndexedDB (অফলাইন ব্রাউজার স্টোরেজ)' : 'LocalStorage Fallback'}</strong>
          </div>
          <div class="save-status-item">
            <span>🕒 শেষ সেভ:</span>
            <strong>${lastSavedFormatted}</strong>
          </div>
        </div>

        <!-- Device-Specific Notice Alert -->
        <div class="storage-notice-alert">
          <div class="notice-icon">📌</div>
          <div class="notice-text">
            <strong>ডিভাইস-নির্দিষ্ট সেভ তথ্য (Device-Specific Storage):</strong>
            <p>${notice.bangla}</p>
            <p style="opacity: 0.85; margin-top: 4px; font-size: 0.82rem;">${notice.english}</p>
          </div>
        </div>

        <!-- Driver Shift & Lifetime Statistics -->
        <div class="stats-overview-grid">
          <div class="stat-card">
            <span class="stat-icon">💰</span>
            <div class="stat-info">
              <span class="stat-label">পকেটের টাকা (Wallet)</span>
              <span class="stat-val">৳ ${stats.cash}</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💵</span>
            <div class="stat-info">
              <span class="stat-label">আজকের উপার্জন (Today)</span>
              <span class="stat-val">৳ ${stats.todayEarnings} / ৳ ${stats.dailyRentGoal}</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🏆</span>
            <div class="stat-info">
              <span class="stat-label">মোট আয় (Lifetime)</span>
              <span class="stat-val">৳ ${statistics.lifetimeEarnings}</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🚖</span>
            <div class="stat-info">
              <span class="stat-label">সম্পন্ন ট্রিপ (Trips)</span>
              <span class="stat-val">${statistics.totalTripsCompleted} টি</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🛣️</span>
            <div class="stat-info">
              <span class="stat-label">মোট দূরত্ব (Distance)</span>
              <span class="stat-val">${statistics.totalDistanceKm.toFixed(1)} km</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⭐</span>
            <div class="stat-info">
              <span class="stat-label">চালকের সুনাম (Rating)</span>
              <span class="stat-val">${stats.reputation}%</span>
            </div>
          </div>
        </div>

        <!-- CNG Garage & Vehicle Upgrades -->
        <div class="garage-upgrades-section">
          <h4 class="garage-title">🔧 সিএনজি গ্যারেজ ও পারফরম্যান্স টিউনিং (Upgrades):</h4>
          
          <div class="upgrade-row">
            <div class="upgrade-info">
              <strong>🚀 ইঞ্জিন টিউনিং (Engine Acceleration & Speed)</strong>
              <small>লেভেল ${upgrades.engineLevel}/3 • গতি ও পিকআপ ১৫% বৃদ্ধি</small>
            </div>
            <div>
              ${engineCost !== null 
                ? `<button id="btn-upgrade-engine" class="upgrade-btn ${stats.cash >= engineCost ? 'can-afford' : 'disabled'}">
                    আপগ্রেড করুন (৳${engineCost})
                   </button>`
                : `<span class="max-badge">সর্বোচ্চ লেভেল (MAX)</span>`}
            </div>
          </div>

          <div class="upgrade-row">
            <div class="upgrade-info">
              <strong>🛑 হাইড্রোলিক ব্রেক (Hydraulic Brakes System)</strong>
              <small>লেভেল ${upgrades.brakesLevel}/3 • দ্রুত নিরাপদ ব্রেকিং ২৫% বৃদ্ধি</small>
            </div>
            <div>
              ${brakesCost !== null 
                ? `<button id="btn-upgrade-brakes" class="upgrade-btn ${stats.cash >= brakesCost ? 'can-afford' : 'disabled'}">
                    আপগ্রেড করুন (৳${brakesCost})
                   </button>`
                : `<span class="max-badge">সর্বোচ্চ লেভেল (MAX)</span>`}
            </div>
          </div>

          <div class="upgrade-row">
            <div class="upgrade-info">
              <strong>⛽ বড় গ্যাস সিলিন্ডার (CNG Gas Cylinder Capacity)</strong>
              <small>লেভেল ${upgrades.tankCapacityLevel}/3 • গ্যাস ধারণক্ষমতা ২৫% বৃদ্ধি</small>
            </div>
            <div>
              ${tankCost !== null 
                ? `<button id="btn-upgrade-tank" class="upgrade-btn ${stats.cash >= tankCost ? 'can-afford' : 'disabled'}">
                    আপগ্রেড করুন (৳${tankCost})
                   </button>`
                : `<span class="max-badge">সর্বোচ্চ লেভেল (MAX)</span>`}
            </div>
          </div>
        </div>

        <!-- Save Management Actions -->
        <div class="save-actions-section">
          <h4 class="garage-title">📁 সেভ ব্যাকআপ ও রিস্টোর (Save Backup & Restore):</h4>
          <div class="save-btn-group">
            <button id="btn-quick-save" class="menu-btn secondary-btn save-action-btn">💾 এখনই সেভ করুন (Save Now)</button>
            <button id="btn-export-save" class="menu-btn secondary-btn save-action-btn">📥 ফাইল ব্যাকআপ ডাউনলোড (Export)</button>
            <button id="btn-import-save" class="menu-btn secondary-btn save-action-btn">📤 সেভ রিস্টোর করুন (Import)</button>
            <button id="btn-reset-save" class="menu-btn secondary-btn save-action-btn danger-btn">🗑️ প্রগ্রেস রিসেট (Reset)</button>
          </div>
          <input type="file" id="save-file-input" accept=".json" style="display:none;" />
          <div id="save-feedback-msg" class="save-feedback-text"></div>
        </div>
      </div>
    `;

    this.showModal('💾 গেম সেভ ও গ্যারেজ (Save & Progress)', html);
    this.bindSaveModalEvents();
  }

  // Bind Events for Save & Upgrade Actions
  private bindSaveModalEvents(): void {
    const feedbackEl = document.getElementById('save-feedback-msg');

    const showMsg = (msg: string, isError: boolean = false) => {
      if (feedbackEl) {
        feedbackEl.textContent = msg;
        feedbackEl.style.color = isError ? '#ff5252' : '#69f0ae';
      }
    };

    // Engine Upgrade
    document.getElementById('btn-upgrade-engine')?.addEventListener('click', () => {
      const res = this.saveManager.buyUpgrade('engine');
      if (res.success) {
        this.renderSaveModal();
        showMsg(`✅ ${res.messageBangla}`);
      } else {
        showMsg(`⚠️ ${res.messageBangla}`, true);
      }
    });

    // Brakes Upgrade
    document.getElementById('btn-upgrade-brakes')?.addEventListener('click', () => {
      const res = this.saveManager.buyUpgrade('brakes');
      if (res.success) {
        this.renderSaveModal();
        showMsg(`✅ ${res.messageBangla}`);
      } else {
        showMsg(`⚠️ ${res.messageBangla}`, true);
      }
    });

    // Tank Upgrade
    document.getElementById('btn-upgrade-tank')?.addEventListener('click', () => {
      const res = this.saveManager.buyUpgrade('tank');
      if (res.success) {
        this.renderSaveModal();
        showMsg(`✅ ${res.messageBangla}`);
      } else {
        showMsg(`⚠️ ${res.messageBangla}`, true);
      }
    });

    // Quick Save
    document.getElementById('btn-quick-save')?.addEventListener('click', () => {
      this.saveManager.save(true);
      showMsg('✅ গেম প্রগ্রেস সফলভাবে IndexedDB তে সংরক্ষিত হয়েছে!');
    });

    // Export Save
    document.getElementById('btn-export-save')?.addEventListener('click', () => {
      this.saveManager.downloadSaveBackup();
      showMsg('📥 ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে! ফাইলটি নিরাপদে সংরক্ষণ করুন।');
    });

    // Import Save Button & File Input
    const fileInput = document.getElementById('save-file-input') as HTMLInputElement | null;
    document.getElementById('btn-import-save')?.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = ev.target?.result as string;
        const res = await this.saveManager.importSaveJson(text);
        if (res.success) {
          this.renderSaveModal();
          showMsg(`✅ ${res.messageBangla}`);
        } else {
          showMsg(`❌ ${res.messageBangla}`, true);
        }
      };
      reader.readAsText(file);
    });

    // Reset Progress
    document.getElementById('btn-reset-save')?.addEventListener('click', async () => {
      const confirmed = window.confirm(
        'সতর্কবার্তা!\nআপনি কি নিশ্চিত যে আপনার সমস্ত ট্রিপ, টাকা এবং সিএনজি আপগ্রেড মুছে দিয়ে নতুনভাবে শুরু করতে চান?'
      );
      if (confirmed) {
        await this.saveManager.resetAllProgress();
        this.renderSaveModal();
        showMsg('🔄 গেম প্রগ্রেস সফলভাবে রিসেট করা হয়েছে!');
      }
    });
  }

  public showPauseMenu(): void {
    this.isPaused = true;
    this.pauseMenuEl.classList.remove('hidden');
  }

  public hidePauseMenu(): void {
    this.isPaused = false;
    this.pauseMenuEl.classList.add('hidden');
  }

  public showModal(title: string, htmlContent: string): void {
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-content');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = htmlContent;
    this.modalEl.classList.remove('hidden');
  }

  public closeModal(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    this.modalEl.classList.add('hidden');
  }
}
