// Responsive 3-wheel vehicle physics simulation for Bangladeshi CNG
import * as THREE from 'three';
import { VehicleTelemetry } from '../types';
import { CNGVehicle } from './CNGVehicle';
import { SaveManager } from '../storage/SaveManager';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  isWater?: boolean;
}

export class VehicleController {
  public vehicle: CNGVehicle;

  // Transform
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY: number = 0; // Heading in radians
  public velocity: number = 0;  // Forward velocity in m/s (positive = forward, negative = reverse)

  // Steering & Dynamics
  public currentSteerAngle: number = 0;
  public targetSteerAngle: number = 0;
  public bodyRoll: number = 0;
  public bodyPitch: number = 0;
  public verticalOffset: number = 0;
  public verticalVelocity: number = 0;

  // Engine & Fuel
  public rpm: number = 900;     // Idle 900 RPM
  public fuelPercent: number = 88;
  public headlightsOn: boolean = false;
  public hornActive: boolean = false;

  // Physics constants
  private readonly MAX_SPEED_FORWARD = 14.5; // ~52 km/h
  private readonly MAX_SPEED_REVERSE = 4.2;  // ~15 km/h
  private readonly ACCELERATION = 7.5;       // m/s^2
  private readonly BRAKING = 14.0;           // m/s^2
  private readonly HANDBRAKE_BRAKING = 22.0; // m/s^2
  private readonly DRAG = 0.985;             // Aerodynamic + rolling drag
  private readonly MAX_STEER = 0.65;         // ~37 degrees max lock
  private readonly WHEELBASE = 1.7;          // Meters

  // Inputs
  public input = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    horn: false,
    interact: false,
    switchCamera: false
  };

  // World Colliders
  private colliders: CollisionBox[] = [];

  // Fixed physics timestep accumulator
  private physicsAccumulator: number = 0;
  private readonly FIXED_DT = 1 / 60; // 60 Hz deterministic physics
  private readonly MAX_SUB_STEPS = 4;

  constructor(vehicle: CNGVehicle) {
    this.vehicle = vehicle;
  }

  public setColliders(boxes: CollisionBox[]): void {
    this.colliders = boxes;
  }

  public setPosition(x: number, y: number, z: number, heading: number = 0): void {
    this.position.set(x, y, z);
    this.rotationY = heading;
    this.velocity = 0;
    this.vehicle.root.position.copy(this.position);
    this.vehicle.root.rotation.y = this.rotationY;
  }

  public update(delta: number): VehicleTelemetry {
    // Accumulate time for fixed timestep physics
    this.physicsAccumulator += Math.min(delta, 0.1);
    let subSteps = 0;

    while (this.physicsAccumulator >= this.FIXED_DT && subSteps < this.MAX_SUB_STEPS) {
      this.stepFixed(this.FIXED_DT);
      this.physicsAccumulator -= this.FIXED_DT;
      subSteps++;
    }

    if (subSteps >= this.MAX_SUB_STEPS) {
      this.physicsAccumulator = 0;
    }

    // Update 3D transforms & visual interpolation
    this.vehicle.root.position.set(this.position.x, this.position.y + this.verticalOffset, this.position.z);
    this.vehicle.root.rotation.y = this.rotationY;

    // Engine RPM calculation
    const speedKmh = Math.abs(this.velocity) * 3.6;
    if (Math.abs(this.velocity) < 0.2) {
      this.rpm = 900 + Math.random() * 80;
    } else {
      const baseRpmForSpeed = 1200 + (speedKmh % 14) * 220;
      this.rpm = Math.min(4800, baseRpmForSpeed + this.input.throttle * 900);
    }

    // Gear indicator
    let gearDisplay: 'N' | '1' | '2' | '3' | '4' | 'R' = 'N';
    if (this.velocity < -0.1) gearDisplay = 'R';
    else if (speedKmh < 1) gearDisplay = 'N';
    else if (speedKmh < 14) gearDisplay = '1';
    else if (speedKmh < 26) gearDisplay = '2';
    else if (speedKmh < 38) gearDisplay = '3';
    else gearDisplay = '4';

    const telemetry: VehicleTelemetry = {
      speedKmh: Math.round(speedKmh),
      rpm: Math.round(this.rpm),
      gear: gearDisplay,
      steerAngle: -this.currentSteerAngle,
      throttle: this.input.throttle,
      brake: this.input.brake,
      handbrake: this.input.handbrake,
      headlights: this.headlightsOn,
      horn: this.hornActive,
      fuelPercent: Math.round(this.fuelPercent),
      bodyRoll: this.bodyRoll,
      bodyPitch: this.bodyPitch
    };

    this.vehicle.update(telemetry, delta);

    return telemetry;
  }

  // Deterministic 60Hz Physics Step
  private stepFixed(dt: number): void {
    const upgrades = SaveManager.getInstance().getUpgrades();
    const engineMult = 1.0 + (upgrades.engineLevel - 1) * 0.15; // +15% per upgrade
    const brakesMult = 1.0 + (upgrades.brakesLevel - 1) * 0.25; // +25% per upgrade
    const effectiveMaxSpeed = this.MAX_SPEED_FORWARD * engineMult;
    const effectiveAccel = this.ACCELERATION * engineMult;
    const effectiveBraking = this.BRAKING * brakesMult;

    // 1. Steering with speed sensitivity
    const speedRatio = Math.min(Math.abs(this.velocity) / effectiveMaxSpeed, 1.0);
    const speedAdjustedMaxSteer = this.MAX_STEER * (1.0 - speedRatio * 0.45);
    this.targetSteerAngle = this.input.steer * speedAdjustedMaxSteer;
    
    const steerSpeed = 9.0;
    this.currentSteerAngle += (this.targetSteerAngle - this.currentSteerAngle) * Math.min(steerSpeed * dt, 1.0);

    // 2. Throttle & Acceleration
    if (this.fuelPercent <= 0) {
      this.input.throttle = 0;
    }

    if (this.input.throttle > 0 && !this.input.handbrake) {
      if (this.velocity < 0) {
        this.velocity += effectiveBraking * dt;
        if (this.velocity > 0) this.velocity = 0;
      } else {
        const powerCurve = Math.max(0.3, 1.0 - (this.velocity / effectiveMaxSpeed));
        this.velocity += effectiveAccel * this.input.throttle * powerCurve * dt;
        if (this.velocity > effectiveMaxSpeed) this.velocity = effectiveMaxSpeed;
      }
      this.fuelPercent = Math.max(0, this.fuelPercent - dt * 0.015);
    }

    // 3. Braking & Reverse
    if (this.input.brake > 0) {
      if (this.velocity > 0.1) {
        this.velocity -= effectiveBraking * this.input.brake * dt;
        if (this.velocity < 0) this.velocity = 0;
      } else {
        this.velocity -= (effectiveAccel * 0.6) * this.input.brake * dt;
        if (this.velocity < -this.MAX_SPEED_REVERSE) this.velocity = -this.MAX_SPEED_REVERSE;
      }
    }

    // 4. Handbrake
    if (this.input.handbrake) {
      if (this.velocity > 0) {
        this.velocity = Math.max(0, this.velocity - this.HANDBRAKE_BRAKING * brakesMult * dt);
      } else if (this.velocity < 0) {
        this.velocity = Math.min(0, this.velocity + this.HANDBRAKE_BRAKING * dt);
      }
    }

    // 5. Drag & Friction
    if (this.input.throttle === 0 && this.input.brake === 0) {
      this.velocity *= Math.pow(this.DRAG, dt * 60);
      if (Math.abs(this.velocity) < 0.05) this.velocity = 0;
    }

    // 6. Kinematics
    if (Math.abs(this.velocity) > 0.01) {
      const angularVelocity = (this.velocity / this.WHEELBASE) * Math.sin(this.currentSteerAngle);
      this.rotationY += angularVelocity * dt;
    }

    // 7. Collision Detection with Spatial Filtering
    const forwardX = Math.sin(this.rotationY);
    const forwardZ = Math.cos(this.rotationY);
    const nextX = this.position.x + forwardX * this.velocity * dt;
    const nextZ = this.position.z + forwardZ * this.velocity * dt;

    const cngRadius = 0.85;
    let collisionOccurred = false;

    for (let i = 0; i < this.colliders.length; i++) {
      const b = this.colliders[i];
      // Fast AABB broadphase rejection
      if (Math.abs(b.minX - nextX) > 25 && Math.abs(b.maxX - nextX) > 25) continue;
      if (Math.abs(b.minZ - nextZ) > 25 && Math.abs(b.maxZ - nextZ) > 25) continue;

      if (
        nextX + cngRadius > b.minX &&
        nextX - cngRadius < b.maxX &&
        nextZ + cngRadius > b.minZ &&
        nextZ - cngRadius < b.maxZ
      ) {
        collisionOccurred = true;
        this.velocity = -this.velocity * 0.35;
        break;
      }
    }

    if (!collisionOccurred) {
      this.position.x = nextX;
      this.position.z = nextZ;
      if (Math.abs(this.velocity) > 0.1) {
        SaveManager.getInstance().getStatistics().totalDistanceKm += (Math.abs(this.velocity) * dt) / 1000;
      }
    }

    // 8. Suspension & Body Dynamics
    const turningCentrifugal = this.velocity * (this.velocity / this.WHEELBASE) * Math.sin(this.currentSteerAngle);
    const targetRoll = -turningCentrifugal * 0.045;
    this.bodyRoll += (targetRoll - this.bodyRoll) * 0.15;

    let targetPitch = 0;
    if (this.input.brake > 0 && this.velocity > 1) {
      targetPitch = 0.05 * this.input.brake;
    } else if (this.input.throttle > 0) {
      targetPitch = -0.04 * this.input.throttle;
    }
    this.bodyPitch += (targetPitch - this.bodyPitch) * 0.15;

    this.verticalOffset += this.verticalVelocity * dt;
    this.verticalVelocity -= 25.0 * this.verticalOffset * dt;
    this.verticalVelocity *= 0.88;
  }

  // Trigger suspension bump (e.g. passing over a speed hump)
  public triggerBump(intensity: number = 0.12): void {
    this.verticalVelocity = intensity * 4.0;
  }

  public toggleHeadlights(): boolean {
    this.headlightsOn = !this.headlightsOn;
    return this.headlightsOn;
  }
}
