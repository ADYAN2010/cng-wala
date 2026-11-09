// Complete In-Game HUD, Illustrated GPS Minimap, Fullscreen Map Modal & Mobile Controls
import { VehicleTelemetry, ShiftStats, DialogueStep, DialogueChoice } from '../types';
import { DhanmondiMap } from '../world/DhanmondiMap';
import { TrafficAI } from '../traffic/TrafficAI';
import { PassengerManager } from '../passengers/PassengerManager';

export class HUD {
  private container: HTMLElement;

  // UI Elements
  private speedElement!: HTMLElement;
  private gearElement!: HTMLElement;
  private fuelElement!: HTMLElement;
  private cashElement!: HTMLElement;
  private timeElement!: HTMLElement;
  private rentGoalElement!: HTMLElement;
  private toastElement!: HTMLElement;
  private interactPromptElement!: HTMLElement;
  
  // Dialogue Elements
  private dialogueBoxElement!: HTMLElement;
  private speakerNameElement!: HTMLElement;
  private dialogueBanglaElement!: HTMLElement;
  private dialogueEnglishElement!: HTMLElement;
  private choicesContainerElement!: HTMLElement;

  // Minimap & Full Map Modal
  private minimapCanvas!: HTMLCanvasElement;
  private minimapCtx!: CanvasRenderingContext2D;
  private fullMapCanvas!: HTMLCanvasElement;
  private fullMapCtx!: CanvasRenderingContext2D;
  private fullMapModal!: HTMLElement;
  public isFullMapOpen: boolean = false;

  // Callbacks
  public onChoiceSelected: ((choice: DialogueChoice) => void) | null = null;
  public onInteractPressed: (() => void) | null = null;
  public onCameraTogglePressed: (() => void) | null = null;
  public onHornPressed: ((active: boolean) => void) | null = null;
  public onPedalInput: ((throttle: number, brake: number) => void) | null = null;
  public onSteerInput: ((steer: number) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.className = 'hidden'; // Initially hidden during start screen
    this.container.innerHTML = this.getHUDHTML();
    document.body.appendChild(this.container);

    this.cacheElements();
    this.setupMobileControls();
    this.setupMapToggle();
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }

  private getHUDHTML(): string {
    return `
      <!-- Top Left: Shift Stats & Wallet -->
      <div class="hud-top-left">
        <div class="stat-card">
          <div class="stat-row">
            <span class="stat-label">CASH (টাকা)</span>
            <span id="hud-cash" class="stat-value cash-highlight">৳ 350</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">TODAY'S SHIFT</span>
            <span id="hud-rent-goal" class="stat-value">৳ 0 / 800 জমা</span>
          </div>
          <div class="progress-bar-bg">
            <div id="hud-rent-bar" class="progress-bar-fill" style="width: 0%"></div>
          </div>
          <div class="stat-row shift-clock">
            <span id="hud-time" class="stat-time">08:00 AM</span>
            <span class="shift-badge">ধানমন্ডি শিফট</span>
          </div>
        </div>
      </div>

      <!-- Top Right: Illustrated GPS Minimap matching Game Map Reference -->
      <div class="hud-top-right">
        <div class="minimap-container">
          <canvas id="hud-minimap" width="240" height="240"></canvas>
          <div class="minimap-compass">N</div>
          <button id="btn-toggle-fullmap" class="minimap-expand-btn" title="Toggle Full Dhanmondi Map [M]">🗺️ [M]</button>
          <div id="minimap-road-name" class="minimap-road-label">সাত মসজিদ রোড</div>
        </div>
      </div>

      <!-- Bottom Right: Speedometer & Fuel Dashboard -->
      <div class="hud-bottom-right">
        <div class="cluster-card">
          <div class="speed-gauge">
            <span id="hud-speed" class="speed-number">0</span>
            <span class="speed-unit">KM/H</span>
            <span id="hud-gear" class="gear-badge">N</span>
          </div>
          <div class="fuel-row">
            <span class="fuel-icon">⛽ CNG</span>
            <div class="fuel-bar-bg">
              <div id="hud-fuel-bar" class="fuel-bar-fill" style="width: 88%"></div>
            </div>
            <span id="hud-fuel-text" class="fuel-text">88%</span>
          </div>
        </div>
      </div>

      <!-- Center Bottom: Interaction Prompts -->
      <div id="hud-interact-prompt" class="interact-banner hidden">
        <span class="interact-key">[E]</span>
        <span class="interact-text">TALK TO PASSENGER (কথা বলুন)</span>
      </div>

      <!-- Center Bottom: Bangla Dialogue & Negotiation Window -->
      <div id="hud-dialogue-box" class="dialogue-window hidden">
        <div class="dialogue-header">
          <span class="dialogue-avatar">🛺</span>
          <span id="dialogue-speaker" class="dialogue-speaker-name">যাত্রী</span>
        </div>
        <div id="dialogue-bangla" class="dialogue-text-bangla">মামা, ধানমন্ডি ২৭ যাবেন?</div>
        <div id="dialogue-english" class="dialogue-text-english">Mama, will you go to Dhanmondi 27?</div>
        <div id="dialogue-choices" class="choices-container"></div>
      </div>

      <!-- Notification Toast -->
      <div id="hud-toast" class="toast-popup hidden">
        <span id="toast-message">ভাড়া আদায়: ৳ ১২০</span>
      </div>

      <!-- Full-Screen Dhanmondi Illustrated Map Modal -->
      <div id="hud-fullmap-modal" class="fullmap-modal hidden">
        <div class="fullmap-card">
          <div class="fullmap-header">
            <div class="fullmap-title-row">
              <span class="fullmap-badge">FULL NEIGHBOURHOOD COVERAGE</span>
              <h2 class="fullmap-title">DHANMONDI GAME MAP (ধানমন্ডি)</h2>
            </div>
            <button id="btn-close-fullmap" class="fullmap-close-btn">✕ [M]</button>
          </div>
          <div class="fullmap-canvas-wrapper">
            <canvas id="hud-fullmap" width="800" height="720"></canvas>
          </div>
          <div class="fullmap-legend">
            <span class="legend-item"><span class="legend-color-box leg-main"></span> Main Road (হলুদ সড়ক)</span>
            <span class="legend-item"><span class="legend-color-box leg-sub"></span> Sub Road (আবাসিক সড়ক)</span>
            <span class="legend-item"><span class="legend-color-box leg-lake"></span> Dhanmondi Lake (লেক)</span>
            <span class="legend-item"><span class="legend-color-box leg-border"></span> Dhanmondi Boundary (সীমানা)</span>
            <span class="legend-item">🛺 CNG Stand</span>
            <span class="legend-item">🏥 Hospital</span>
            <span class="legend-item">🏟️ Abahani Stadium</span>
            <span class="legend-item">🚇 Metro Rail (Farmgate)</span>
          </div>
        </div>
      </div>

      <!-- Touch Controls (Mobile / Tablet) -->
      <div id="touch-controls" class="touch-overlay hidden">
        <div class="touch-left-cluster">
          <button id="btn-steer-left" class="touch-btn steer-btn">◀</button>
          <button id="btn-steer-right" class="touch-btn steer-btn">▶</button>
        </div>
        <div class="touch-right-cluster">
          <button id="btn-gas" class="touch-btn pedal-btn gas-btn">GAS</button>
          <button id="btn-brake" class="touch-btn pedal-btn brake-btn">BRAKE</button>
        </div>
        <div class="touch-action-cluster">
          <button id="btn-horn" class="touch-btn action-btn">HORN</button>
          <button id="btn-interact" class="touch-btn action-btn">TALK</button>
          <button id="btn-cam" class="touch-btn action-btn">CAM</button>
          <button id="btn-map" class="touch-btn action-btn">MAP</button>
        </div>
      </div>
    `;
  }

  private cacheElements(): void {
    this.speedElement = document.getElementById('hud-speed')!;
    this.gearElement = document.getElementById('hud-gear')!;
    this.fuelElement = document.getElementById('hud-fuel-text')!;
    this.cashElement = document.getElementById('hud-cash')!;
    this.timeElement = document.getElementById('hud-time')!;
    this.rentGoalElement = document.getElementById('hud-rent-goal')!;
    this.toastElement = document.getElementById('hud-toast')!;
    this.interactPromptElement = document.getElementById('hud-interact-prompt')!;

    this.dialogueBoxElement = document.getElementById('hud-dialogue-box')!;
    this.speakerNameElement = document.getElementById('dialogue-speaker')!;
    this.dialogueBanglaElement = document.getElementById('dialogue-bangla')!;
    this.dialogueEnglishElement = document.getElementById('dialogue-english')!;
    this.choicesContainerElement = document.getElementById('dialogue-choices')!;

    this.minimapCanvas = document.getElementById('hud-minimap') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;

    this.fullMapCanvas = document.getElementById('hud-fullmap') as HTMLCanvasElement;
    this.fullMapCtx = this.fullMapCanvas.getContext('2d')!;
    this.fullMapModal = document.getElementById('hud-fullmap-modal')!;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.getElementById('touch-controls')?.classList.remove('hidden');
    }
  }

  private setupMapToggle(): void {
    const toggleMap = () => {
      this.isFullMapOpen = !this.isFullMapOpen;
      if (this.isFullMapOpen) {
        this.fullMapModal.classList.remove('hidden');
      } else {
        this.fullMapModal.classList.add('hidden');
      }
    };

    document.getElementById('btn-toggle-fullmap')?.addEventListener('click', toggleMap);
    document.getElementById('btn-close-fullmap')?.addEventListener('click', toggleMap);
    document.getElementById('btn-map')?.addEventListener('click', toggleMap);

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'm') {
        toggleMap();
      }
    });
  }

  private setupMobileControls(): void {
    const btnLeft = document.getElementById('btn-steer-left');
    const btnRight = document.getElementById('btn-steer-right');
    const btnGas = document.getElementById('btn-gas');
    const btnBrake = document.getElementById('btn-brake');
    const btnHorn = document.getElementById('btn-horn');
    const btnInteract = document.getElementById('btn-interact');
    const btnCam = document.getElementById('btn-cam');

    let currentSteer = 0;
    let currentGas = 0;
    let currentBrake = 0;

    const bindButton = (el: HTMLElement | null, onDown: () => void, onUp: () => void) => {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('pointerup', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('pointercancel', (e) => { e.preventDefault(); onUp(); });
    };

    bindButton(btnLeft, () => { currentSteer = -1; this.onSteerInput?.(currentSteer); }, () => { currentSteer = 0; this.onSteerInput?.(0); });
    bindButton(btnRight, () => { currentSteer = 1; this.onSteerInput?.(currentSteer); }, () => { currentSteer = 0; this.onSteerInput?.(0); });
    bindButton(btnGas, () => { currentGas = 1; this.onPedalInput?.(currentGas, currentBrake); }, () => { currentGas = 0; this.onPedalInput?.(0, currentBrake); });
    bindButton(btnBrake, () => { currentBrake = 1; this.onPedalInput?.(currentGas, currentBrake); }, () => { currentBrake = 0; this.onPedalInput?.(currentGas, 0); });
    bindButton(btnHorn, () => { this.onHornPressed?.(true); }, () => { this.onHornPressed?.(false); });

    btnInteract?.addEventListener('click', () => this.onInteractPressed?.());
    btnCam?.addEventListener('click', () => this.onCameraTogglePressed?.());
  }

  public update(
    telemetry: VehicleTelemetry,
    stats: ShiftStats,
    timeString: string,
    playerX: number,
    playerZ: number,
    heading: number,
    traffic: TrafficAI,
    passengers: PassengerManager
  ): void {
    this.speedElement.textContent = telemetry.speedKmh.toString();
    this.gearElement.textContent = telemetry.gear;
    this.fuelElement.textContent = `${telemetry.fuelPercent}%`;
    const fuelBar = document.getElementById('hud-fuel-bar');
    if (fuelBar) fuelBar.style.width = `${telemetry.fuelPercent}%`;

    this.cashElement.textContent = `৳ ${stats.cash}`;
    this.timeElement.textContent = timeString;

    const rentText = stats.rentPaid 
      ? `৳ ${stats.todayEarnings} (জমা পরিশোধিত)` 
      : `৳ ${stats.todayEarnings} / 800 জমা`;
    this.rentGoalElement.textContent = rentText;

    const rentPercent = Math.min(100, Math.round((stats.todayEarnings / stats.dailyRentGoal) * 100));
    const rentBar = document.getElementById('hud-rent-bar');
    if (rentBar) rentBar.style.width = `${rentPercent}%`;

    const currentRoad = DhanmondiMap.findNearestRoad({ x: playerX, z: playerZ });
    const roadLabel = document.getElementById('minimap-road-name');
    if (roadLabel) roadLabel.textContent = currentRoad.nameBangla;

    // Draw GPS Radar
    this.drawMinimap(playerX, playerZ, heading, traffic, passengers);

    // If fullscreen map is active, draw it
    if (this.isFullMapOpen) {
      this.drawFullMap(playerX, playerZ, heading, traffic, passengers);
    }
  }

  // Draw HUD Rotating Radar GPS
  private drawMinimap(
    px: number,
    pz: number,
    heading: number,
    traffic: TrafficAI,
    passengers: PassengerManager
  ): void {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.52;

    // Illustrated Map Background Palette
    ctx.fillStyle = '#222f3e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-heading);

    // Lake Turquoise Water Polygon
    ctx.fillStyle = '#00a8ff';
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(0 - px, 0 - pz, 28 * scale, 190 * scale, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(0 - px, 0 - pz, 100 * scale, 0, Math.PI * 2);
    }
    ctx.fill();

    // Abahani Stadium Green Field on Minimap
    ctx.fillStyle = '#2ed573';
    ctx.fillRect((-110 - px) * scale - 14, (-10 - pz) * scale - 10, 28, 20);

    // Road Network Lines
    for (const road of DhanmondiMap.ROADS) {
      const sx = (road.start.x - px) * scale;
      const sz = (road.start.z - pz) * scale;
      const ex = (road.end.x - px) * scale;
      const ez = (road.end.z - pz) * scale;

      // Golden-yellow for main arteries, grey for sub-roads
      ctx.strokeStyle = road.roadType === 'main' ? '#f5c518' : road.roadType === 'bridge' ? '#b33927' : '#718093';
      ctx.lineWidth = road.roadType === 'main' ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(sx, sz);
      ctx.lineTo(ex, ez);
      ctx.stroke();
    }

    // Traffic Dots
    const trafficCars = traffic.getTrafficPositions();
    for (const tc of trafficCars) {
      const tx = (tc.x - px) * scale;
      const tz = (tc.z - pz) * scale;
      ctx.fillStyle = tc.type === 'bus' ? '#e67e22' : '#ffffff';
      ctx.beginPath();
      ctx.arc(tx, tz, tc.type === 'bus' ? 4.0 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Waiting Passengers
    const waitingList = passengers.getPassengerPositions();
    for (const p of waitingList) {
      const pxRel = (p.x - px) * scale;
      const pzRel = (p.z - pz) * scale;
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(pxRel, pzRel, 4.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Passenger Destination Route & Beacon
    if (passengers.currentRidingPassenger) {
      const dest = passengers.currentRidingPassenger.destination;
      const dx = (dest.x - px) * scale;
      const dz = (dest.z - pz) * scale;

      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 3.0;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dx, dz);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#00e676';
      ctx.beginPath();
      ctx.arc(dx, dz, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Player CNG Arrow at center
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx - 7, cy + 8);
    ctx.lineTo(cx + 7, cy + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  // Draw Full-Screen Illustrated Dhanmondi Map
  private drawFullMap(
    px: number,
    pz: number,
    heading: number,
    traffic: TrafficAI,
    passengers: PassengerManager
  ): void {
    const ctx = this.fullMapCtx;
    const w = this.fullMapCanvas.width;
    const h = this.fullMapCanvas.height;
    const cx = w / 2;
    const cy = h / 2 - 10;
    const scale = 1.15; // Zoomed to show entire Dhanmondi

    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, w, h);

    // Dhanmondi Boundary Dashed Red Polygon
    const b = DhanmondiMap.BOUNDS;
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(cx + b.minX * scale, cy + b.minZ * scale, (b.maxX - b.minX) * scale, (b.maxZ - b.minZ) * scale);
    ctx.setLineDash([]);

    // Lake Turquoise Shape
    ctx.fillStyle = '#00a8ff';
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(cx, cy, 38 * scale, 210 * scale, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(cx, cy, 110 * scale, 0, Math.PI * 2);
    }
    ctx.fill();

    // Abahani Club Stadium Green Field
    ctx.fillStyle = '#2ed573';
    ctx.fillRect(cx - 135 * scale, cy - 25 * scale, 50 * scale, 35 * scale);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(cx - 135 * scale, cy - 25 * scale, 50 * scale, 35 * scale);

    // Rabindra Sarobar Semicircular Terraces
    ctx.fillStyle = '#b03a2e';
    ctx.beginPath();
    ctx.arc(cx + 65 * scale, cy + 75 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Road Network
    for (const road of DhanmondiMap.ROADS) {
      const sx = cx + road.start.x * scale;
      const sz = cy + road.start.z * scale;
      const ex = cx + road.end.x * scale;
      const ez = cy + road.end.z * scale;

      ctx.strokeStyle = road.roadType === 'main' ? '#f5c518' : road.roadType === 'bridge' ? '#b33927' : '#576574';
      ctx.lineWidth = road.roadType === 'main' ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(sx, sz);
      ctx.lineTo(ex, ez);
      ctx.stroke();
    }

    // Metro Rail Elevated Track
    ctx.strokeStyle = '#2ed573';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + 160 * scale, cy - 260 * scale);
    ctx.lineTo(cx + 250 * scale, cy - 310 * scale);
    ctx.stroke();

    // Landmark Badges with Bengali Script
    ctx.font = 'bold 13px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';

    for (const lm of DhanmondiMap.LANDMARKS) {
      const lx = cx + lm.position.x * scale;
      const lz = cy + lm.position.z * scale;

      let icon = '📍';
      let badgeColor = '#2c3e50';
      if (lm.category === 'hospital') { icon = '🏥'; badgeColor = '#c0392b'; }
      if (lm.category === 'shopping') { icon = '🛍️'; badgeColor = '#8e44ad'; }
      if (lm.category === 'sports') { icon = '🏟️'; badgeColor = '#27ae60'; }
      if (lm.category === 'cng_stand') { icon = '🛺'; badgeColor = '#16a085'; }
      if (lm.category === 'metro') { icon = '🚇'; badgeColor = '#008037'; }

      // Draw Badge Pill
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(lx - 55, lz - 12, 110, 24, 6);
      } else if (typeof ctx.rect === 'function') {
        ctx.rect(lx - 55, lz - 12, 110, 24);
      }
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${icon} ${lm.nameBangla.split(' ')[0]}`, lx, lz + 4);
    }

    // Player CNG on Full Map
    const pxMap = cx + px * scale;
    const pzMap = cy + pz * scale;

    ctx.save();
    ctx.translate(pxMap, pzMap);
    ctx.rotate(heading);
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.lineTo(-8, -8);
    ctx.lineTo(8, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 14px "Hind Siliguri", sans-serif';
    ctx.fillText('🛺 আপনার সিএনজি (YOU)', pxMap, pzMap - 14);
  }

  public showInteractPrompt(visible: boolean, text: string = 'TALK TO PASSENGER (কথা বলুন)'): void {
    if (visible) {
      this.interactPromptElement.classList.remove('hidden');
      const label = this.interactPromptElement.querySelector('.interact-text');
      if (label) label.textContent = text;
    } else {
      this.interactPromptElement.classList.add('hidden');
    }
  }

  public showDialogue(step: DialogueStep): void {
    this.dialogueBoxElement.classList.remove('hidden');
    this.speakerNameElement.textContent = step.speakerNameBangla;
    this.dialogueBanglaElement.textContent = step.textBangla;
    this.dialogueEnglishElement.textContent = step.textEnglish;

    this.choicesContainerElement.innerHTML = '';
    if (step.choices && step.choices.length > 0) {
      step.choices.forEach((choice, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<span class="choice-num">[${idx + 1}]</span> <span class="choice-text-bn">${choice.labelBangla}</span> <span class="choice-text-en">${choice.labelEnglish}</span>`;
        btn.onclick = () => {
          if (this.onChoiceSelected) this.onChoiceSelected(choice);
        };
        this.choicesContainerElement.appendChild(btn);
      });
    }
  }

  public hideDialogue(): void {
    this.dialogueBoxElement.classList.add('hidden');
    this.choicesContainerElement.innerHTML = '';
  }

  public showToast(message: string, durationMs: number = 3000): void {
    const msgEl = document.getElementById('toast-message');
    if (msgEl) msgEl.textContent = message;
    this.toastElement.classList.remove('hidden');
    setTimeout(() => {
      this.toastElement.classList.add('hidden');
    }, durationMs);
  }
}
