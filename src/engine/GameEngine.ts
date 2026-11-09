// Core Game Engine & Adaptive System Orchestrator
import * as THREE from 'three';
import { WorldManager } from '../world/WorldManager';
import { CNGVehicle } from '../vehicle/CNGVehicle';
import { VehicleController } from '../vehicle/VehicleController';
import { CameraController } from './CameraController';
import { TrafficAI } from '../traffic/TrafficAI';
import { AudioManager } from './AudioManager';
import { WeatherManager } from './WeatherManager';
import { DialogueManager } from '../passengers/DialogueManager';
import { PassengerManager } from '../passengers/PassengerManager';
import { EconomyManager } from '../economy/EconomyManager';
import { HUD } from '../ui/HUD';
import { MenuManager } from '../ui/MenuManager';
import { GraphicsManager } from './GraphicsManager';

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Subsystems
  public worldManager: WorldManager;
  public cngVehicle: CNGVehicle;
  public vehicleController: VehicleController;
  public cameraController: CameraController;
  public trafficAI: TrafficAI;
  public audioManager: AudioManager;
  public weatherManager: WeatherManager;
  public dialogueManager: DialogueManager;
  public passengerManager: PassengerManager;
  public economyManager: EconomyManager;
  public hud: HUD;
  public menuManager: MenuManager;
  public graphicsManager: GraphicsManager;

  // Timing & Lifecycle
  private clock: THREE.Clock;
  private isRunning: boolean = true;
  private isWorldTransitioning: boolean = false;
  private worldLoadingOverlayEl: HTMLElement | null = null;

  constructor() {
    this.graphicsManager = GraphicsManager.getInstance();

    // 1. Setup Three.js WebGL Renderer with Adaptive Scale
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.graphicsManager.settings.antiAliasing,
      powerPreference: 'high-performance'
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    document.body.appendChild(this.renderer.domElement);

    this.graphicsManager.setRenderer(this.renderer);

    // 2. Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0035);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 600);

    // 3. Initialize Subsystems (Deferred World Loading for Instant Responsive Menu)
    this.worldManager = new WorldManager(this.scene, true);
    this.cngVehicle = new CNGVehicle();
    this.scene.add(this.cngVehicle.root);

    this.vehicleController = new VehicleController(this.cngVehicle);
    // Initial spawn at Dhanmondi CNG Garage / Stand (x = -110, z = 220)
    this.vehicleController.setPosition(-110, 0, 220, 0);

    this.cameraController = new CameraController(this.camera, this.vehicleController);
    this.trafficAI = new TrafficAI(this.scene, false, this.graphicsManager.settings.trafficDensity);
    this.audioManager = new AudioManager();
    this.weatherManager = new WeatherManager(this.scene, this.worldManager);
    this.dialogueManager = new DialogueManager(this.audioManager);
    this.passengerManager = new PassengerManager(
      this.scene,
      this.cngVehicle,
      this.dialogueManager,
      this.audioManager,
      false,
      this.graphicsManager.settings.pedestrianDensity
    );
    this.economyManager = new EconomyManager();
    this.hud = new HUD();
    this.menuManager = new MenuManager(this.audioManager);

    this.clock = new THREE.Clock();

    // 4. Bind Events & Lifecycle Callbacks
    this.createWorldLoadingOverlay();
    this.bindEvents();
    this.setupHUDCallbacks();
    this.setupLifecycleTransitions();

    // Listen to live graphics changes
    this.graphicsManager.addChangeListener((settings) => {
      this.weatherManager.applyGraphicsProfile(settings);
      this.trafficAI.setDensity(settings.trafficDensity);
      this.passengerManager.initPassengers(settings.pedestrianDensity);
    });

    // 5. Start Animation Loop
    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  // Create loading overlay for "Start Driving" asynchronous world build
  private createWorldLoadingOverlay(): void {
    this.worldLoadingOverlayEl = document.createElement('div');
    this.worldLoadingOverlayEl.id = 'world-loading-overlay';
    this.worldLoadingOverlayEl.className = 'menu-overlay hidden';
    this.worldLoadingOverlayEl.innerHTML = `
      <div class="menu-box start-box">
        <div class="title-badge">DHANMONDI OPEN WORLD</div>
        <h2 class="game-subtitle" id="world-loading-title">ধানমন্ডি শহরের রাস্তা তৈরি হচ্ছে...</h2>
        <div class="startup-progress-track">
          <div id="world-loading-bar" class="startup-progress-bar" style="width: 15%"></div>
        </div>
        <p id="world-loading-step" class="startup-step-text">সাত মসজিদ রোড ও লেক প্রস্তুত...</p>
      </div>
    `;
    document.body.appendChild(this.worldLoadingOverlayEl);
  }

  private setupLifecycleTransitions(): void {
    // START DRIVING clicked from Main Menu
    this.menuManager.onStartGame = async () => {
      await this.transitionToDriving();
    };

    // Restart shift
    this.menuManager.onRestartShift = () => {
      this.economyManager.resetShift();
      this.vehicleController.setPosition(-110, 0, 220, 0);
      this.hud.showToast('New Shift Started at Dhanmondi Stand (নতুন শিফট শুরু)', 2500);
    };

    // Weather toggle
    this.menuManager.onWeatherToggle = () => {
      const raining = this.weatherManager.toggleRain();
      this.hud.showToast(raining ? 'Monsoon Rain Started (বৃষ্টি শুরু)' : 'Rain Stopped (বৃষ্টি থেমেছে)', 2000);
    };
  }

  // Asynchronous transition into Open-World Driving
  private async transitionToDriving(): Promise<void> {
    if (this.worldManager.isWorldLoaded) {
      // World already generated, start driving immediately
      this.menuManager.isGameStarted = true;
      this.hud.setVisible(true);
      this.hud.showToast('Shift Active: Drive safely around Dhanmondi! (শিফট শুরু হয়েছে)', 3500);
      return;
    }

    this.isWorldTransitioning = true;
    if (this.worldLoadingOverlayEl) {
      this.worldLoadingOverlayEl.classList.remove('hidden');
    }

    const barEl = document.getElementById('world-loading-bar');
    const stepEl = document.getElementById('world-loading-step');

    try {
      await this.worldManager.buildWorldProgressively((pct, msg) => {
        if (barEl) barEl.style.width = `${pct}%`;
        if (stepEl) stepEl.textContent = msg;
      });

      // Update colliders
      this.vehicleController.setColliders(this.worldManager.colliders);

      // Initialize traffic and pedestrians based on active profile
      this.trafficAI.initTraffic(this.graphicsManager.settings.trafficDensity);
      this.passengerManager.initPassengers(this.graphicsManager.settings.pedestrianDensity);
      this.weatherManager.applyGraphicsProfile(this.graphicsManager.settings);

      // Place CNG at Stand ready to roll
      this.vehicleController.setPosition(-110, 0, 220, 0);

      // Smooth fade out of loading screen
      if (this.worldLoadingOverlayEl) {
        this.worldLoadingOverlayEl.classList.add('hidden');
      }

      this.menuManager.isGameStarted = true;
      this.hud.setVisible(true);
      this.hud.showToast('Dhanmondi Shift Ready: Look for waiting passengers on sidewalks! (যাত্রী খুঁজুন)', 4000);
    } catch (err) {
      console.error('[GameEngine] World generation failed:', err);
      if (this.worldLoadingOverlayEl) {
        this.worldLoadingOverlayEl.classList.add('hidden');
      }
      this.menuManager.isGameStarted = true;
    } finally {
      this.isWorldTransitioning = false;
    }
  }

  private bindEvents(): void {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      try {
        this.audioManager.ensureContext();
      } catch (err) {
        console.warn('Audio context error:', err);
      }

      if (e.repeat) return;
      const key = e.key.toLowerCase();

      // Only control car when game has started and is not paused
      if (!this.menuManager.isGameStarted || this.menuManager.isPaused) return;

      // Driving controls
      if (key === 'w' || key === 'arrowup') this.vehicleController.input.throttle = 1;
      if (key === 's' || key === 'arrowdown') this.vehicleController.input.brake = 1;
      if (key === 'a' || key === 'arrowleft') this.vehicleController.input.steer = -1;
      if (key === 'd' || key === 'arrowright') this.vehicleController.input.steer = 1;
      if (key === ' ') this.vehicleController.input.handbrake = true;

      // Horn
      if (key === 'h') {
        this.vehicleController.hornActive = true;
        this.audioManager.startHorn();
      }

      // Headlights toggle
      if (key === 'l') {
        this.vehicleController.toggleHeadlights();
      }

      // Camera view toggle
      if (key === 'c') {
        const newMode = this.cameraController.cycleMode();
        this.hud.showToast(`Camera: ${newMode.toUpperCase()}`, 1200);
      }

      // Interact with passenger
      if (key === 'e') {
        this.triggerInteraction();
      }

      // Number keys for dialogue choices
      if (['1', '2', '3', '4'].includes(key) && this.dialogueManager.currentStep?.choices) {
        const choiceIdx = parseInt(key, 10) - 1;
        const choices = this.dialogueManager.currentStep.choices;
        if (choices[choiceIdx]) {
          const nextStep = this.dialogueManager.chooseOption(choices[choiceIdx]);
          if (nextStep) {
            this.hud.showDialogue(nextStep);
          } else {
            this.hud.hideDialogue();
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') this.vehicleController.input.throttle = 0;
      if (key === 's' || key === 'arrowdown') this.vehicleController.input.brake = 0;
      if (key === 'a' || key === 'arrowleft') {
        if (this.vehicleController.input.steer < 0) this.vehicleController.input.steer = 0;
      }
      if (key === 'd' || key === 'arrowright') {
        if (this.vehicleController.input.steer > 0) this.vehicleController.input.steer = 0;
      }
      if (key === ' ') this.vehicleController.input.handbrake = false;

      if (key === 'h') {
        this.vehicleController.hornActive = false;
        this.audioManager.stopHorn();
      }
    });

    // Ambient Rickshaw Bell
    setInterval(() => {
      if (this.menuManager.isGameStarted && !this.menuManager.isPaused && Math.random() > 0.45) {
        this.audioManager.playRickshawBell();
      }
    }, 18000);
  }

  private setupHUDCallbacks(): void {
    this.hud.onSteerInput = (steer) => { this.vehicleController.input.steer = steer; };
    this.hud.onPedalInput = (throttle, brake) => {
      this.vehicleController.input.throttle = throttle;
      this.vehicleController.input.brake = brake;
    };
    this.hud.onHornPressed = (active) => {
      if (active) this.audioManager.startHorn();
      else this.audioManager.stopHorn();
    };
    this.hud.onCameraTogglePressed = () => {
      const mode = this.cameraController.cycleMode();
      this.hud.showToast(`Camera: ${mode.toUpperCase()}`, 1200);
    };
    this.hud.onInteractPressed = () => {
      this.triggerInteraction();
    };

    this.hud.onChoiceSelected = (choice) => {
      const nextStep = this.dialogueManager.chooseOption(choice);
      if (nextStep) this.hud.showDialogue(nextStep);
      else this.hud.hideDialogue();
    };

    this.passengerManager.onPassengerPickedUp = (p) => {
      this.hud.hideDialogue();
      this.hud.showToast(`Trip Started: Heading to ${p.destinationNameBangla} (গন্তব্যের দিকে চলুন)`, 4000);
    };

    this.passengerManager.onPassengerDroppedOff = (p, fare) => {
      this.economyManager.addTripEarning(fare);
      this.hud.showToast(`Trip Complete: ৳ ${fare} earned! (ভাড়া আদায়: ৳ ${fare})`, 4500);
    };
  }

  private triggerInteraction(): void {
    const nearby = this.passengerManager.findNearbyPassenger(this.vehicleController.position, 6.0);
    if (nearby && Math.abs(this.vehicleController.velocity) < 1.0) {
      const step = this.dialogueManager.startNegotiation(nearby.data);
      this.hud.showDialogue(step);
      this.hud.showInteractPrompt(false);
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.graphicsManager.applyRendererScale();
  }

  // Master Render & Physics Loop
  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    // Frame limiter & performance sampler
    const proceed = this.graphicsManager.updatePerformance(now);
    if (!proceed) return;

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // 1. Menu State: Smooth, Lightweight Camera Orbit around Stand
    if (!this.menuManager.isGameStarted || this.isWorldTransitioning) {
      const t = now * 0.00035;
      const radius = 5.2;
      this.camera.position.set(-110 + Math.sin(t) * radius, 2.0 + Math.cos(t * 0.5) * 0.4, 220 + Math.cos(t) * radius);
      this.camera.lookAt(-110, 1.05, 220);

      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 2. Active In-Game Driving Simulation
    if (this.isRunning && !this.menuManager.isPaused) {
      // Vehicle Physics with fixed timestep accumulator
      const telemetry = this.vehicleController.update(delta);

      // Camera follow
      this.cameraController.update(delta);

      // Distance limit based on view distance setting
      const viewDistMap = { low: 90, medium: 170, high: 270, ultra: 380 };
      const currentDist = viewDistMap[this.graphicsManager.settings.viewDistance] || 200;

      // World chunk culling & animations
      this.worldManager.update(delta, this.vehicleController.position, currentDist);

      // Traffic AI with simulation LOD
      this.trafficAI.update(delta, this.vehicleController.position, currentDist);
      this.graphicsManager.activeVehiclesCount = this.trafficAI.getTrafficPositions().length;

      // Day/Night & Weather
      this.weatherManager.update(delta, this.vehicleController.position);

      // Passengers
      this.passengerManager.update(delta, this.vehicleController.position, telemetry.speedKmh);

      // Interaction check
      if (!this.passengerManager.currentRidingPassenger) {
        const nearby = this.passengerManager.findNearbyPassenger(this.vehicleController.position, 6.0);
        if (nearby && telemetry.speedKmh < 3) {
          this.hud.showInteractPrompt(true, `[E] TALK TO ${nearby.data.name.toUpperCase()} (কথা বলুন)`);
        } else {
          this.hud.showInteractPrompt(false);
        }
      } else {
        const dest = this.passengerManager.currentRidingPassenger.destination;
        const dist = Math.hypot(dest.x - this.vehicleController.position.x, dest.z - this.vehicleController.position.z);
        if (dist < 18) {
          this.hud.showInteractPrompt(true, `[S] STOP TO DROP PASSENGER (যাত্রী নামান)`);
        } else {
          this.hud.showInteractPrompt(false);
        }
      }

      // Audio engine update
      this.audioManager.updateEngineSound(telemetry);

      // HUD & Minimap
      this.hud.update(
        telemetry,
        this.economyManager.stats,
        this.weatherManager.getFormattedTime(),
        this.vehicleController.position.x,
        this.vehicleController.position.z,
        this.vehicleController.rotationY,
        this.trafficAI,
        this.passengerManager
      );
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
