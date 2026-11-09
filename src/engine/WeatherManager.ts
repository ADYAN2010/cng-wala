// Dynamic Day/Night Cycle & Dhaka Monsoon Weather System
import * as THREE from 'three';
import { WorldManager } from '../world/WorldManager';
import { GraphicsProfileSettings } from '../types';

export class WeatherManager {
  private scene: THREE.Scene;
  private worldManager: WorldManager;

  // Lights
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;

  // Rain particle system
  private rainParticles: THREE.Points | null = null;
  public isRaining: boolean = false;

  // In-game time of day (minutes from midnight, e.g. 7:00 AM = 420 mins)
  public timeMinutes: number = 480; // 8:00 AM start of Dhanmondi shift
  public timeScale: number = 10;    // 1 real sec = 10 in-game seconds (1 real min = 10 in-game mins)

  constructor(scene: THREE.Scene, worldManager: WorldManager) {
    this.scene = scene;
    this.worldManager = worldManager;

    // Directional Sunlight / Moonlight
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.dirLight.position.set(60, 100, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 280;
    this.dirLight.shadow.camera.left = -160;
    this.dirLight.shadow.camera.right = 160;
    this.dirLight.shadow.camera.top = 160;
    this.dirLight.shadow.camera.bottom = -160;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Hemisphere Ambient Skylight
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5236, 0.7);
    this.scene.add(this.hemiLight);

    // Setup rain particles
    this.initRainSystem();
    this.updateLighting();
  }

  // Setup Dhaka monsoon rain particles
  private initRainSystem(particleCount: number = 2000): void {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles.geometry.dispose();
      if (Array.isArray(this.rainParticles.material)) {
        this.rainParticles.material.forEach(m => m.dispose());
      } else {
        this.rainParticles.material.dispose();
      }
      this.rainParticles = null;
    }

    if (particleCount <= 0) return;

    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 45;
      positions[i + 2] = (Math.random() - 0.5) * 160;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.15,
      transparent: true,
      opacity: 0.65
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = this.isRaining;
    this.scene.add(this.rainParticles);
  }

  public applyGraphicsProfile(settings: GraphicsProfileSettings): void {
    if (settings.shadowQuality === 'off') {
      this.dirLight.castShadow = false;
    } else {
      this.dirLight.castShadow = true;
      const size = settings.shadowQuality === 'high' ? 2048 : (settings.shadowQuality === 'medium' ? 1024 : 512);
      this.dirLight.shadow.mapSize.width = size;
      this.dirLight.shadow.mapSize.height = size;
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null as unknown as THREE.WebGLRenderTarget;
      }
    }

    const countMap: Record<string, number> = {
      off: 0,
      low: 500,
      medium: 1500,
      high: 3500
    };
    const count = countMap[settings.weatherParticles] ?? 1500;
    this.initRainSystem(count);
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    // Progress shift time
    this.timeMinutes += (delta * this.timeScale) / 60;
    if (this.timeMinutes >= 1440) this.timeMinutes = 0;

    this.updateLighting();

    // Update rain particles around player
    if (this.isRaining && this.rainParticles) {
      this.rainParticles.position.x = playerPos.x;
      this.rainParticles.position.z = playerPos.z;

      const posAttr = this.rainParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= 32 * delta; // Falling speed
        if (arr[i] < 0) {
          arr[i] = 40;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  private updateLighting(): void {
    const hour = this.timeMinutes / 60;

    // Angle of sun across the sky (-PI/2 at 6 AM, 0 at noon, PI/2 at 6 PM)
    const sunAngle = ((hour - 6) / 12) * Math.PI - Math.PI / 2;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 120;
    const sunY = Math.max(10, sunHeight * 120);

    this.dirLight.position.set(sunX, sunY, 40);

    // Morning, Afternoon, Sunset, Night colors
    if (hour >= 6 && hour < 10) {
      // Crisp Morning
      this.scene.background = new THREE.Color(0x87ceeb);
      this.dirLight.color.setHex(0xfff3e0);
      this.dirLight.intensity = 1.6;
      this.hemiLight.intensity = 0.8;
      this.worldManager.setStreetlightsActive(false);
    } else if (hour >= 10 && hour < 16.5) {
      // Bright Midday
      this.scene.background = new THREE.Color(0x64b5f6);
      this.dirLight.color.setHex(0xffffff);
      this.dirLight.intensity = 2.0;
      this.hemiLight.intensity = 0.9;
      this.worldManager.setStreetlightsActive(false);
    } else if (hour >= 16.5 && hour < 18.5) {
      // Golden Hour Sunset (Dhaka Godhuli)
      this.scene.background = new THREE.Color(0xd35400);
      this.dirLight.color.setHex(0xff7043);
      this.dirLight.intensity = 1.4;
      this.hemiLight.intensity = 0.6;
      this.worldManager.setStreetlightsActive(true);
    } else {
      // Dhaka Night (Indigo sky, neon, sodium streetlights)
      this.scene.background = new THREE.Color(0x0a1128);
      this.dirLight.color.setHex(0x3f51b5);
      this.dirLight.intensity = 0.3; // Moonlight
      this.hemiLight.intensity = 0.25;
      this.worldManager.setStreetlightsActive(true);
    }

    if (this.isRaining) {
      this.scene.background = new THREE.Color(0x37474f);
      this.dirLight.intensity *= 0.5;
    }
  }

  public toggleRain(): boolean {
    this.isRaining = !this.isRaining;
    if (this.rainParticles) this.rainParticles.visible = this.isRaining;
    return this.isRaining;
  }

  public getFormattedTime(): string {
    const totalMinutes = Math.floor(this.timeMinutes);
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours12)}:${pad(mins)} ${ampm}`;
  }
}
