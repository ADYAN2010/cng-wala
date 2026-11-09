// Complete Passenger System spanning the Full Dhanmondi Open World
import * as THREE from 'three';
import { PassengerData, PassengerArchetype, Landmark, DensityLevel } from '../types';
import { DhanmondiMap } from '../world/DhanmondiMap';
import { DialogueManager } from './DialogueManager';
import { CNGVehicle } from '../vehicle/CNGVehicle';
import { AudioManager } from '../engine/AudioManager';

interface PassengerEntity {
  data: PassengerData;
  group: THREE.Group;
  armMesh: THREE.Mesh;
  waveTimer: number;
}

export class PassengerManager {
  private scene: THREE.Scene;
  private cngVehicle: CNGVehicle;
  private dialogueManager: DialogueManager;
  private audioManager: AudioManager;

  private activePassengers: PassengerEntity[] = [];
  public currentRidingPassenger: PassengerData | null = null;
  public activeDestinationBeacon: THREE.Group | null = null;
  public currentDensity: DensityLevel = 'medium';

  public onPassengerPickedUp: ((passenger: PassengerData) => void) | null = null;
  public onPassengerDroppedOff: ((passenger: PassengerData, fareEarned: number) => void) | null = null;

  constructor(
    scene: THREE.Scene,
    cngVehicle: CNGVehicle,
    dialogueManager: DialogueManager,
    audioManager: AudioManager,
    autoSpawn: boolean = false,
    initialDensity: DensityLevel = 'medium'
  ) {
    this.scene = scene;
    this.cngVehicle = cngVehicle;
    this.dialogueManager = dialogueManager;
    this.audioManager = audioManager;
    this.currentDensity = initialDensity;

    if (autoSpawn) {
      this.initPassengers(initialDensity);
    }

    this.dialogueManager.onFareAgreed = (fare: number) => {
      this.handleFareAgreed(fare);
    };

    this.dialogueManager.onDialogueEnded = (status) => {
      if (status === 'rejected' && this.dialogueManager.activePassenger) {
        this.dialogueManager.activePassenger.status = 'waiting';
      }
    };
  }

  // Populate sectors of Dhanmondi with waiting passengers scaled by density
  public initPassengers(density: DensityLevel = this.currentDensity): void {
    this.clearPassengers();
    this.currentDensity = density;

    const allLocations = [
      DhanmondiMap.getLandmark('dhanmondi_27')!,
      DhanmondiMap.getLandmark('city_hospital')!,
      DhanmondiMap.getLandmark('bangladesh_eye_hospital')!,
      DhanmondiMap.getLandmark('shankar_crossing')!,
      DhanmondiMap.getLandmark('abahani_club')!,
      DhanmondiMap.getLandmark('ibn_sina')!,
      DhanmondiMap.getLandmark('dhanmondi_8a')!,
      DhanmondiMap.getLandmark('jigatola_bus_stand')!,
      DhanmondiMap.getLandmark('rabindra_sarobar')!,
      DhanmondiMap.getLandmark('dhanmondi_32')!,
      DhanmondiMap.getLandmark('labaid_hospital')!,
      DhanmondiMap.getLandmark('science_lab')!
    ].filter(Boolean);

    const count = density === 'low' ? 4 : (density === 'medium' ? 7 : 12);
    const locationsToUse = allLocations.slice(0, count);

    let id = 1;
    for (const loc of locationsToUse) {
      this.spawnPassengerAtLandmark(loc, `passenger_${id++}`);
    }
  }

  public clearPassengers(): void {
    for (const p of this.activePassengers) {
      this.scene.remove(p.group);
    }
    this.activePassengers = [];
  }

  private spawnPassengerAtLandmark(landmark: Landmark, id: string): void {
    const archetypes: PassengerArchetype[] = ['student', 'office_worker', 'elderly', 'shopper', 'hospital_patient'];
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    const names = [
      { name: 'Tanvir', bangla: 'তানভীর (বিশ্ববিদ্যালয় ছাত্র)' },
      { name: 'Rahim Chacha', bangla: 'রহিম চাচা (মুরব্বি)' },
      { name: 'Shirin Sultana', bangla: 'শিরীন সুলতানা (কেনাকাটা)' },
      { name: 'Asif Mahmud', bangla: 'আসিফ (অফিস কর্মী)' },
      { name: 'Monir Hossain', bangla: 'মনির হোসেন (রোগীর আত্মীয়)' },
      { name: 'Farhana Yeasmin', bangla: 'ফারহানা (কলেজ শিক্ষিকা)' },
      { name: 'Kamal Uddin', bangla: 'কামাল ভাই (ব্যবসায়ী)' }
    ];
    const person = names[Math.floor(Math.random() * names.length)];

    // Destination across Dhanmondi
    const allLandmarks = DhanmondiMap.LANDMARKS.filter(l => l.id !== landmark.id && l.id !== 'cng_stand_home');
    const destination = allLandmarks[Math.floor(Math.random() * allLandmarks.length)];

    const dist = Math.hypot(landmark.position.x - destination.position.x, landmark.position.z - destination.position.z);
    const baseFare = Math.max(70, Math.round((50 + dist * 0.45) / 10) * 10);

    const data: PassengerData = {
      id,
      name: person.name,
      nameBangla: person.bangla,
      archetype,
      pickupLocation: {
        x: landmark.position.x + (Math.random() - 0.5) * 8,
        z: landmark.position.z + (Math.random() - 0.5) * 8
      },
      pickupNameBangla: landmark.nameBangla,
      destination: { x: destination.position.x, z: destination.position.z },
      destinationNameBangla: destination.nameBangla,
      destinationNameEnglish: destination.nameEnglish,
      targetFare: baseFare,
      maxFare: Math.round(baseFare * 1.35),
      patience: 1.0,
      avatarColor: archetype === 'student' ? '#3498db' : archetype === 'elderly' ? '#e67e22' : '#2ecc71',
      clothingColor: archetype === 'student' ? '#2980b9' : archetype === 'elderly' ? '#ecf0f1' : '#8e44ad',
      status: 'waiting'
    };

    const group = new THREE.Group();
    group.position.set(data.pickupLocation.x, 0, data.pickupLocation.z);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.7 });
    const clothMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(data.clothingColor), roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), clothMat);
    torso.position.y = 0.95;
    torso.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), skinMat);
    head.position.y = 1.38;
    head.castShadow = true;

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.2), darkMat);
    legs.position.y = 0.35;
    legs.castShadow = true;

    // Waving Arm
    const armGeo = new THREE.BoxGeometry(0.1, 0.45, 0.1);
    armGeo.translate(0, 0.2, 0);
    const arm = new THREE.Mesh(armGeo, clothMat);
    arm.position.set(0.24, 1.1, 0);

    // Waving Callout Sign (✋ মামা, খালি?)
    const labelTex = this.createSignalBillboardTexture();
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ map: labelTex, transparent: true }));
    label.position.set(0, 2.0, 0);

    group.add(torso, head, legs, arm, label);
    this.scene.add(group);

    this.activePassengers.push({
      data,
      group,
      armMesh: arm,
      waveTimer: Math.random() * 10
    });
  }

  private createSignalBillboardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(4, 4, 248, 88, 16);
    } else if (typeof ctx.rect === 'function') {
      ctx.rect(4, 4, 248, 88);
    }
    ctx.fill();

    ctx.strokeStyle = '#f57f17';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✋ মামা, খালি?', 128, 48);

    return new THREE.CanvasTexture(canvas);
  }

  public findNearbyPassenger(cngPos: THREE.Vector3, maxDist: number = 6.0): PassengerEntity | null {
    if (this.currentRidingPassenger) return null;

    let closest: PassengerEntity | null = null;
    let minDist = maxDist;

    for (const p of this.activePassengers) {
      if (p.data.status !== 'waiting') continue;
      const d = Math.hypot(p.group.position.x - cngPos.x, p.group.position.z - cngPos.z);
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    }
    return closest;
  }

  private handleFareAgreed(fare: number): void {
    if (!this.dialogueManager.activePassenger) return;
    const pData = this.dialogueManager.activePassenger;

    const idx = this.activePassengers.findIndex(p => p.data.id === pData.id);
    if (idx !== -1) {
      this.scene.remove(this.activePassengers[idx].group);
      this.activePassengers.splice(idx, 1);
    }

    pData.status = 'riding';
    this.currentRidingPassenger = pData;

    this.cngVehicle.setPassengerVisible(true, pData.clothingColor);
    this.createDestinationBeacon(pData.destination.x, pData.destination.z);

    if (this.onPassengerPickedUp) {
      this.onPassengerPickedUp(pData);
    }
  }

  private createDestinationBeacon(x: number, z: number): void {
    if (this.activeDestinationBeacon) {
      this.scene.remove(this.activeDestinationBeacon);
    }

    const beacon = new THREE.Group();
    beacon.position.set(x, 0, z);

    // Glowing Green Curbside Ring
    const ringGeo = new THREE.RingGeometry(3.0, 4.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e676, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.08;
    beacon.add(ring);

    // Translucent Beacon Pillar
    const cylGeo = new THREE.CylinderGeometry(1.5, 1.5, 24, 16, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = 12;
    beacon.add(cyl);

    this.scene.add(beacon);
    this.activeDestinationBeacon = beacon;
  }

  public update(delta: number, cngPos: THREE.Vector3, cngSpeedKmh: number): void {
    // Waving hand animation on pedestrians
    for (const p of this.activePassengers) {
      p.waveTimer += delta * 4;
      const dist = Math.hypot(p.group.position.x - cngPos.x, p.group.position.z - cngPos.z);
      if (dist < 35) {
        p.armMesh.rotation.z = -1.2 + Math.sin(p.waveTimer) * 0.7;
      } else {
        p.armMesh.rotation.z = -0.2;
      }
    }

    if (this.activeDestinationBeacon) {
      this.activeDestinationBeacon.rotation.y += delta * 1.6;
    }

    // Dropoff detection
    if (this.currentRidingPassenger && this.activeDestinationBeacon) {
      const dest = this.currentRidingPassenger.destination;
      const distToDest = Math.hypot(dest.x - cngPos.x, dest.z - cngPos.z);

      if (distToDest < 7.0 && cngSpeedKmh < 2.5) {
        this.completeTrip();
      }
    }
  }

  private completeTrip(): void {
    if (!this.currentRidingPassenger) return;

    const passenger = this.currentRidingPassenger;
    const earnedFare = this.dialogueManager.agreedFare;

    this.cngVehicle.setPassengerVisible(false);
    this.currentRidingPassenger = null;

    if (this.activeDestinationBeacon) {
      this.scene.remove(this.activeDestinationBeacon);
      this.activeDestinationBeacon = null;
    }

    this.audioManager.playCashChime();
    this.audioManager.speakBanglaDialogue('এই যে মামা, আপনার ভাড়াটা রাখেন। ধন্যবাদ।', 'adult_male');

    if (this.onPassengerDroppedOff) {
      this.onPassengerDroppedOff(passenger, earnedFare);
    }

    // Spawn another passenger to keep the open-world loop alive
    setTimeout(() => {
      const pair = DhanmondiMap.getRandomTripPoints();
      this.spawnPassengerAtLandmark(pair.pickup, `passenger_${Date.now()}`);
    }, 2000);
  }

  public getPassengerPositions(): { x: number; z: number }[] {
    return this.activePassengers.map(p => ({
      x: p.group.position.x,
      z: p.group.position.z
    }));
  }
}
