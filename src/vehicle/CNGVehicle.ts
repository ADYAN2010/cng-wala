// Realistic 3D Bangladeshi Green CNG Auto-Rickshaw Model
import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator';
import { VehicleTelemetry } from '../types';

export class CNGVehicle {
  public root: THREE.Group;
  public bodyGroup: THREE.Group;
  
  // Moving parts
  public frontForkGroup: THREE.Group;
  public frontWheel: THREE.Mesh;
  public rearLeftWheel: THREE.Mesh;
  public rearRightWheel: THREE.Mesh;
  public steeringHandlebar: THREE.Group;
  public passengerModel: THREE.Group;

  // Lights
  public headlight: THREE.SpotLight;
  public headlightMesh: THREE.Mesh;
  public rearLightsMesh: THREE.Mesh;
  public rearLightsMat: THREE.MeshStandardMaterial;

  // Dashboard & interior
  public speedoNeedle: THREE.Mesh;

  // Collision bounding box approximation
  public readonly width = 1.4;
  public readonly length = 2.6;
  public readonly height = 1.8;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'CNG_Vehicle';

    // The body group handles chassis roll, pitch, and engine vibration
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    // Front fork group for steering rotation
    this.frontForkGroup = new THREE.Group();
    this.frontForkGroup.position.set(0, 0.45, 1.05);
    this.bodyGroup.add(this.frontForkGroup);

    // Build wheels
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xbdc3c7,
      roughness: 0.4,
      metalness: 0.7
    });

    // Front Wheel
    this.frontWheel = new THREE.Mesh(wheelGeo, [tireMat, rimMat, rimMat]);
    this.frontWheel.castShadow = true;
    this.frontForkGroup.add(this.frontWheel);

    // Rear Wheels
    this.rearLeftWheel = new THREE.Mesh(wheelGeo, [tireMat, rimMat, rimMat]);
    this.rearLeftWheel.position.set(-0.62, 0.28, -0.65);
    this.rearLeftWheel.castShadow = true;
    this.bodyGroup.add(this.rearLeftWheel);

    this.rearRightWheel = new THREE.Mesh(wheelGeo, [tireMat, rimMat, rimMat]);
    this.rearRightWheel.position.set(0.62, 0.28, -0.65);
    this.rearRightWheel.castShadow = true;
    this.bodyGroup.add(this.rearRightWheel);

    // Materials
    const cngGreenMat = new THREE.MeshStandardMaterial({
      color: 0x127339, // Dhaka Municipal Green
      roughness: 0.35,
      metalness: 0.2
    });
    const blackCanopyMat = new THREE.MeshStandardMaterial({
      color: 0x151618,
      roughness: 0.85,
      metalness: 0.05
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x222629,
      roughness: 0.5,
      metalness: 0.8
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xecf0f1,
      roughness: 0.15,
      metalness: 0.95
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5
    });

    // 1. Chassis and Floorboard
    const floorGeo = new THREE.BoxGeometry(1.24, 0.1, 2.3);
    const floorMesh = new THREE.Mesh(floorGeo, darkMetalMat);
    floorMesh.position.set(0, 0.32, 0);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    this.bodyGroup.add(floorMesh);

    // 2. Front Nose Cowl (Aerodynamic green cowl)
    const noseGeo = new THREE.CylinderGeometry(0.38, 0.52, 0.75, 12, 1, false, -Math.PI / 2, Math.PI);
    noseGeo.rotateX(Math.PI / 2);
    noseGeo.rotateZ(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, cngGreenMat);
    noseMesh.position.set(0, 0.58, 0.95);
    noseMesh.scale.set(1.1, 0.8, 1);
    noseMesh.castShadow = true;
    this.bodyGroup.add(noseMesh);

    // Front Mudguard
    const mudguardGeo = new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI, 0, Math.PI / 2);
    mudguardGeo.rotateX(-Math.PI / 2);
    const mudguard = new THREE.Mesh(mudguardGeo, cngGreenMat);
    mudguard.position.set(0, 0.08, 0);
    this.frontForkGroup.add(mudguard);

    // Front Suspension Fork Stems
    const forkStemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
    const leftFork = new THREE.Mesh(forkStemGeo, chromeMat);
    leftFork.position.set(-0.12, 0.1, 0);
    const rightFork = new THREE.Mesh(forkStemGeo, chromeMat);
    rightFork.position.set(0.12, 0.1, 0);
    this.frontForkGroup.add(leftFork);
    this.frontForkGroup.add(rightFork);

    // 3. Lower Body Side Panels (Green)
    const lowerBodyGeo = new THREE.BoxGeometry(1.28, 0.5, 1.45);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, cngGreenMat);
    lowerBody.position.set(0, 0.55, -0.42);
    lowerBody.castShadow = true;
    this.bodyGroup.add(lowerBody);

    // 4. Rear Engine & CNG Tank Compartment
    const cngTankGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.0, 12);
    cngTankGeo.rotateZ(Math.PI / 2);
    const cngTankMat = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      roughness: 0.4,
      metalness: 0.6
    });
    const cngTank = new THREE.Mesh(cngTankGeo, cngTankMat);
    cngTank.position.set(0, 0.5, -1.05);
    this.bodyGroup.add(cngTank);

    // Rear engine cover louvers
    const rearCoverGeo = new THREE.BoxGeometry(1.24, 0.45, 0.15);
    const rearCover = new THREE.Mesh(rearCoverGeo, darkMetalMat);
    rearCover.position.set(0, 0.55, -1.15);
    this.bodyGroup.add(rearCover);

    // 5. Cabin Roof & Curved Canopy
    const roofCurve = new THREE.Shape();
    roofCurve.moveTo(-0.64, 0);
    roofCurve.quadraticCurveTo(0, 0.22, 0.64, 0);
    roofCurve.lineTo(0.64, -0.05);
    roofCurve.quadraticCurveTo(0, 0.18, -0.64, -0.05);
    roofCurve.closePath();

    const extrudeSettings = { depth: 2.1, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const roofGeo = new THREE.ExtrudeGeometry(roofCurve, extrudeSettings);
    roofGeo.rotateY(Math.PI);
    roofGeo.translate(0, 1.7, 0.95);
    const canopyMesh = new THREE.Mesh(roofGeo, blackCanopyMat);
    canopyMesh.castShadow = true;
    this.bodyGroup.add(canopyMesh);

    // 6. Cabin Support Pillars & Safety Cage
    const pillarMat = darkMetalMat;
    const pGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.15, 8);

    // 4 Corner Pillars
    const pFL = new THREE.Mesh(pGeo, pillarMat);
    pFL.position.set(-0.58, 1.15, 0.7);
    const pFR = new THREE.Mesh(pGeo, pillarMat);
    pFR.position.set(0.58, 1.15, 0.7);
    const pRL = new THREE.Mesh(pGeo, pillarMat);
    pRL.position.set(-0.6, 1.15, -1.05);
    const pRR = new THREE.Mesh(pGeo, pillarMat);
    pRR.position.set(0.6, 1.15, -1.05);
    this.bodyGroup.add(pFL, pFR, pRL, pRR);

    // Dhaka signature Protective Iron Mesh Cage Doors (Side Grills)
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      wireframe: true,
      roughness: 0.7
    });
    const cageGeo = new THREE.PlaneGeometry(0.9, 0.65, 8, 6);
    const leftCage = new THREE.Mesh(cageGeo, wireMat);
    leftCage.rotation.y = Math.PI / 2;
    leftCage.position.set(-0.64, 1.15, -0.4);
    const rightCage = new THREE.Mesh(cageGeo, wireMat);
    rightCage.rotation.y = -Math.PI / 2;
    rightCage.position.set(0.64, 1.15, -0.4);
    this.bodyGroup.add(leftCage, rightCage);

    // 7. Windshield
    const windshieldGeo = new THREE.PlaneGeometry(1.12, 0.65);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.25, 0.7);
    windshield.rotation.x = -0.15;
    this.bodyGroup.add(windshield);

    // Windshield Frame
    const frameGeo = new THREE.BoxGeometry(1.16, 0.68, 0.03);
    const frameMesh = new THREE.Mesh(frameGeo, darkMetalMat);
    frameMesh.position.copy(windshield.position);
    frameMesh.rotation.copy(windshield.rotation);
    this.bodyGroup.add(frameMesh);

    // Single windshield wiper
    const wiperGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6);
    wiperGeo.rotateZ(0.3);
    const wiper = new THREE.Mesh(wiperGeo, darkMetalMat);
    wiper.position.set(0.05, 1.22, 0.72);
    this.bodyGroup.add(wiper);

    // 8. Driver Handlebar & Dashboard
    this.steeringHandlebar = new THREE.Group();
    this.steeringHandlebar.position.set(0, 0.95, 0.55);

    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8);
    barGeo.rotateZ(Math.PI / 2);
    const barMesh = new THREE.Mesh(barGeo, darkMetalMat);
    this.steeringHandlebar.add(barMesh);

    // Rubber Grips
    const gripGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
    gripGeo.rotateZ(Math.PI / 2);
    const gripL = new THREE.Mesh(gripGeo, darkMetalMat);
    gripL.position.set(-0.26, 0, 0);
    const gripR = new THREE.Mesh(gripGeo, darkMetalMat);
    gripR.position.set(0.26, 0, 0);
    this.steeringHandlebar.add(gripL, gripR);
    this.bodyGroup.add(this.steeringHandlebar);

    // Dashboard casing with Speedometer & Meter
    const dashTexture = TextureGenerator.createCNGDashTexture();
    const dashMat = new THREE.MeshStandardMaterial({
      map: dashTexture,
      roughness: 0.6
    });
    const dashGeo = new THREE.BoxGeometry(0.35, 0.22, 0.15);
    const dashMesh = new THREE.Mesh(dashGeo, dashMat);
    dashMesh.position.set(0, 0.85, 0.65);
    dashMesh.rotation.x = -0.4;
    this.bodyGroup.add(dashMesh);

    // Speedometer needle
    const needleGeo = new THREE.BoxGeometry(0.008, 0.06, 0.005);
    needleGeo.translate(0, 0.025, 0);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.speedoNeedle = new THREE.Mesh(needleGeo, needleMat);
    this.speedoNeedle.position.set(0, 0.89, 0.73);
    this.speedoNeedle.rotation.x = -0.4;
    this.bodyGroup.add(this.speedoNeedle);

    // 9. Seating
    const driverSeatGeo = new THREE.BoxGeometry(0.42, 0.12, 0.42);
    const driverSeat = new THREE.Mesh(driverSeatGeo, blackCanopyMat);
    driverSeat.position.set(0, 0.52, 0.15);
    driverSeat.castShadow = true;
    this.bodyGroup.add(driverSeat);

    // Passenger Rear Bench (Floral Rexine fabric)
    const rexineTexture = TextureGenerator.createRexineSeatTexture();
    const rexineMat = new THREE.MeshStandardMaterial({
      map: rexineTexture,
      roughness: 0.7
    });
    const benchGeo = new THREE.BoxGeometry(1.16, 0.16, 0.52);
    const benchSeat = new THREE.Mesh(benchGeo, rexineMat);
    benchSeat.position.set(0, 0.54, -0.65);
    benchSeat.castShadow = true;
    const benchBackGeo = new THREE.BoxGeometry(1.16, 0.55, 0.12);
    const benchBack = new THREE.Mesh(benchBackGeo, rexineMat);
    benchBack.position.set(0, 0.85, -0.92);
    benchBack.castShadow = true;
    this.bodyGroup.add(benchSeat, benchBack);

    // 10. Front Headlight
    const hlGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 16);
    hlGeo.rotateX(Math.PI / 2);
    const hlBezelMat = chromeMat;
    const hlGlassMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.headlightMesh = new THREE.Mesh(hlGeo, [hlBezelMat, hlGlassMat, hlBezelMat]);
    this.headlightMesh.position.set(0, 0.78, 1.25);
    this.bodyGroup.add(this.headlightMesh);

    // Dynamic Night Spotlight
    this.headlight = new THREE.SpotLight(0xfff4d6, 12, 45, Math.PI / 5, 0.35, 1.2);
    this.headlight.position.set(0, 0.78, 1.3);
    this.headlight.target.position.set(0, 0.2, 15);
    this.headlight.castShadow = true;
    this.headlight.shadow.bias = -0.001;
    this.headlight.visible = true;
    this.bodyGroup.add(this.headlight);
    this.bodyGroup.add(this.headlight.target);

    // 11. Rear Brake / Tail Lights
    this.rearLightsMat = new THREE.MeshStandardMaterial({
      color: 0x990000,
      emissive: 0x550000,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    const tlGeo = new THREE.BoxGeometry(0.14, 0.08, 0.04);
    const tlLeft = new THREE.Mesh(tlGeo, this.rearLightsMat);
    tlLeft.position.set(-0.52, 0.58, -1.22);
    const tlRight = new THREE.Mesh(tlGeo, this.rearLightsMat);
    tlRight.position.set(0.52, 0.58, -1.22);
    this.rearLightsMesh = tlLeft; // Reference
    this.bodyGroup.add(tlLeft, tlRight);

    // 12. Side Mirrors
    const mirrorStemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6);
    const mirrorGlassGeo = new THREE.BoxGeometry(0.09, 0.15, 0.02);
    
    const leftStem = new THREE.Mesh(mirrorStemGeo, chromeMat);
    leftStem.rotation.z = -Math.PI / 4;
    leftStem.position.set(-0.64, 1.3, 0.65);
    const leftMirror = new THREE.Mesh(mirrorGlassGeo, darkMetalMat);
    leftMirror.position.set(-0.72, 1.38, 0.65);
    
    const rightStem = new THREE.Mesh(mirrorStemGeo, chromeMat);
    rightStem.rotation.z = Math.PI / 4;
    rightStem.position.set(0.64, 1.3, 0.65);
    const rightMirror = new THREE.Mesh(mirrorGlassGeo, darkMetalMat);
    rightMirror.position.set(0.72, 1.38, 0.65);

    this.bodyGroup.add(leftStem, leftMirror, rightStem, rightMirror);

    // 13. Registration Number Plates: "ঢাকা মেট্রো - থ ১১-৮৪৫২"
    const plateTex = TextureGenerator.createCNGNumberPlateTexture();
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
    const plateGeo = new THREE.PlaneGeometry(0.38, 0.12);

    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, 0.42, 1.32);
    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, 0.38, -1.23);
    rearPlate.rotation.y = Math.PI;
    this.bodyGroup.add(frontPlate, rearPlate);

    // 14. Rubber Mudflaps with decorative Dhaka motif
    const flapGeo = new THREE.PlaneGeometry(0.24, 0.18);
    const flapMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const leftFlap = new THREE.Mesh(flapGeo, flapMat);
    leftFlap.position.set(-0.62, 0.16, -0.92);
    const rightFlap = new THREE.Mesh(flapGeo, flapMat);
    rightFlap.position.set(0.62, 0.16, -0.92);
    this.bodyGroup.add(leftFlap, rightFlap);

    // 15. Passenger Character in Rear Seat (Hidden until passenger boards)
    this.passengerModel = this.buildPassengerModel();
    this.passengerModel.visible = false;
    this.bodyGroup.add(this.passengerModel);
  }

  // Construct a stylized seated Dhaka passenger character
  private buildPassengerModel(): THREE.Group {
    const passenger = new THREE.Group();
    passenger.position.set(0.25, 0.6, -0.65);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3498db, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.9 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.32, 0.4, 0.2);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0, 0.25, 0);

    // Head
    const headGeo = new THREE.SphereGeometry(0.11, 12, 12);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.55, 0);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.115, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.56, 0);

    // Seated Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.12, 0.35);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.09, 0.05, 0.14);
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.09, 0.05, 0.14);

    passenger.add(torso, head, hair, legL, legR);
    return passenger;
  }

  // Update visual animation states: steering, wheel rolls, body tilt, vibration
  public update(telemetry: VehicleTelemetry, delta: number): void {
    // 1. Front fork steering angle
    this.frontForkGroup.rotation.y = telemetry.steerAngle;
    this.steeringHandlebar.rotation.y = telemetry.steerAngle * 0.8;

    // 2. Wheel rolling rotation based on velocity (v = omega * r)
    const wheelRadius = 0.28;
    const speedMps = (telemetry.speedKmh * 1000) / 3600;
    const rollDelta = (speedMps / wheelRadius) * delta;

    this.frontWheel.rotation.x += rollDelta;
    this.rearLeftWheel.rotation.x += rollDelta;
    this.rearRightWheel.rotation.x += rollDelta;

    // 3. Dynamic chassis roll (tilt outward in turns) & pitch (squat/dive)
    const targetRoll = telemetry.bodyRoll;
    const targetPitch = telemetry.bodyPitch;
    this.bodyGroup.rotation.z += (targetRoll - this.bodyGroup.rotation.z) * 0.18;
    this.bodyGroup.rotation.x += (targetPitch - this.bodyGroup.rotation.x) * 0.18;

    // 4. Subtle Dhaka 4-stroke CNG engine idle vibration jitter
    const engineRPM = telemetry.rpm;
    const vibrationAmp = (engineRPM > 1000 ? 0.003 : 0.007);
    const jitter = Math.sin(Date.now() * 0.04) * vibrationAmp;
    this.bodyGroup.position.y = jitter;

    // 5. Dashboard Speedometer needle deflection (0 to 60 km/h)
    const angleRatio = Math.min(telemetry.speedKmh / 60, 1.0);
    const targetNeedleRot = (angleRatio - 0.5) * 2.2;
    this.speedoNeedle.rotation.z = -targetNeedleRot;

    // 6. Brake lights glow
    if (telemetry.brake > 0.05 || telemetry.handbrake) {
      this.rearLightsMat.color.setHex(0xff0000);
      this.rearLightsMat.emissive.setHex(0xff0000);
      this.rearLightsMat.emissiveIntensity = 2.0;
    } else {
      this.rearLightsMat.color.setHex(0x990000);
      this.rearLightsMat.emissive.setHex(0x550000);
      this.rearLightsMat.emissiveIntensity = 0.5;
    }

    // 7. Headlight toggle
    this.headlight.visible = telemetry.headlights;
  }

  public setPassengerVisible(visible: boolean, shirtColor: string = '#3498db'): void {
    this.passengerModel.visible = visible;
    if (visible && this.passengerModel.children[0]) {
      const torso = this.passengerModel.children[0] as THREE.Mesh;
      if (torso.material && 'color' in torso.material) {
        (torso.material as THREE.MeshStandardMaterial).color.setStyle(shirtColor);
      }
    }
  }
}
