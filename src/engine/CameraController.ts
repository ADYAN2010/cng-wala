// Multi-Mode Dynamic Camera Controller
import * as THREE from 'three';
import { VehicleController } from '../vehicle/VehicleController';

export type CameraMode = 'chase' | 'cinematic' | 'cockpit' | 'free_orbit';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'chase';
  private target: VehicleController;

  // Chase Camera Smoothing
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();

  // Free Orbit
  public orbitAngleY: number = 0;
  public orbitAngleX: number = 0.2;

  constructor(camera: THREE.PerspectiveCamera, target: VehicleController) {
    this.camera = camera;
    this.target = target;
    this.currentCameraPos.copy(target.position).add(new THREE.Vector3(0, 3.5, -6));
    this.currentLookAt.copy(target.position);
  }

  public cycleMode(): CameraMode {
    const modes: CameraMode[] = ['chase', 'cinematic', 'cockpit', 'free_orbit'];
    const idx = modes.indexOf(this.mode);
    this.mode = modes[(idx + 1) % modes.length];
    return this.mode;
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  // Instantly snaps camera directly behind vehicle (prevents camera drift on spawn/teleport)
  public snapToTarget(): void {
    const cngPos = this.target.position;
    const cngRotY = this.target.rotationY;
    const dist = 5.6;
    const height = 2.4;
    const idealX = cngPos.x - Math.sin(cngRotY) * dist;
    const idealZ = cngPos.z - Math.cos(cngRotY) * dist;
    const idealY = Math.max(cngPos.y + height, 1.6);
    this.currentCameraPos.set(idealX, idealY, idealZ);
    this.camera.position.copy(this.currentCameraPos);

    const lookAhead = 4.0;
    this.currentLookAt.set(
      cngPos.x + Math.sin(cngRotY) * lookAhead,
      cngPos.y + 1.2,
      cngPos.z + Math.cos(cngRotY) * lookAhead
    );
    this.camera.lookAt(this.currentLookAt);
    this.camera.updateProjectionMatrix();
  }

  public update(delta: number): void {
    const cngPos = this.target.position;
    const cngRotY = this.target.rotationY;
    const speedRatio = Math.min(Math.abs(this.target.velocity) / 14, 1.0);

    if (this.mode === 'chase') {
      // Third-Person Follow Camera
      const dist = 5.6 + speedRatio * 1.2;
      const height = 2.4 + speedRatio * 0.4;

      // Position behind vehicle
      const idealX = cngPos.x - Math.sin(cngRotY) * dist;
      const idealZ = cngPos.z - Math.cos(cngRotY) * dist;
      const idealY = cngPos.y + height;
      const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

      // Smooth lerp
      this.currentCameraPos.lerp(idealPos, Math.min(delta * 8.0, 1.0));
      this.camera.position.copy(this.currentCameraPos);

      // Look slightly ahead of CNG
      const lookAhead = 4.0;
      const targetLookAt = new THREE.Vector3(
        cngPos.x + Math.sin(cngRotY) * lookAhead,
        cngPos.y + 1.2,
        cngPos.z + Math.cos(cngRotY) * lookAhead
      );
      this.currentLookAt.lerp(targetLookAt, Math.min(delta * 10.0, 1.0));
      this.camera.lookAt(this.currentLookAt);
      this.camera.fov = 60 + speedRatio * 6;
      this.camera.updateProjectionMatrix();

    } else if (this.mode === 'cinematic') {
      // Close Dramatic Action Camera
      const dist = 3.6;
      const height = 1.4;

      const idealX = cngPos.x - Math.sin(cngRotY + 0.3) * dist;
      const idealZ = cngPos.z - Math.cos(cngRotY + 0.3) * dist;
      const idealY = cngPos.y + height;

      this.currentCameraPos.lerp(new THREE.Vector3(idealX, idealY, idealZ), Math.min(delta * 9.0, 1.0));
      this.camera.position.copy(this.currentCameraPos);

      const lookTarget = new THREE.Vector3(
        cngPos.x + Math.sin(cngRotY) * 2.0,
        cngPos.y + 0.8,
        cngPos.z + Math.cos(cngRotY) * 2.0
      );
      this.camera.lookAt(lookTarget);
      this.camera.fov = 68;
      this.camera.updateProjectionMatrix();

    } else if (this.mode === 'cockpit') {
      // Driver First-Person View (Inside Driver Seat)
      const eyeHeight = 1.28;
      const eyeForward = 0.22;

      const posX = cngPos.x + Math.sin(cngRotY) * eyeForward;
      const posZ = cngPos.z + Math.cos(cngRotY) * eyeForward;
      const posY = cngPos.y + eyeHeight;

      this.camera.position.set(posX, posY, posZ);

      // Look through windshield towards the road
      const lookTarget = new THREE.Vector3(
        posX + Math.sin(cngRotY) * 15,
        posY - 0.2 + (this.target.bodyPitch * 2),
        posZ + Math.cos(cngRotY) * 15
      );
      this.camera.lookAt(lookTarget);
      this.camera.fov = 72;
      this.camera.updateProjectionMatrix();

    } else if (this.mode === 'free_orbit') {
      // Orbital Camera around vehicle
      const dist = 6.0;
      const camX = cngPos.x + Math.sin(this.orbitAngleY) * Math.cos(this.orbitAngleX) * dist;
      const camY = cngPos.y + Math.sin(this.orbitAngleX) * dist + 1.5;
      const camZ = cngPos.z + Math.cos(this.orbitAngleY) * Math.cos(this.orbitAngleX) * dist;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(cngPos.x, cngPos.y + 1.0, cngPos.z);
      this.camera.fov = 60;
      this.camera.updateProjectionMatrix();
    }
  }
}
