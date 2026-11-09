// Complete Dhanmondi Traffic Simulation across full Open World
import * as THREE from 'three';
import { DhanmondiMap } from '../world/DhanmondiMap';
import { RoadSegment, DensityLevel } from '../types';
import { TextureGenerator } from '../utils/TextureGenerator';

interface TrafficAgent {
  id: string;
  type: 'bus' | 'rickshaw' | 'cng' | 'leguna' | 'car';
  mesh: THREE.Group;
  currentRoad: RoadSegment;
  progress: number;
  direction: 1 | -1;
  laneOffset: number;
  speed: number;
  maxSpeed: number;
  length: number;
  width: number;
}

export class TrafficAI {
  private scene: THREE.Scene;
  private agents: TrafficAgent[] = [];
  private frameCount: number = 0;
  public currentDensity: DensityLevel = 'medium';

  constructor(scene: THREE.Scene, autoSpawn: boolean = false, initialDensity: DensityLevel = 'medium') {
    this.scene = scene;
    this.currentDensity = initialDensity;
    if (autoSpawn) {
      this.initTraffic(initialDensity);
    }
  }

  // Populate Dhanmondi streets with scalable authentic Dhaka traffic
  public initTraffic(density: DensityLevel = this.currentDensity): void {
    this.clearTraffic();
    this.currentDensity = density;

    const mainRoads = DhanmondiMap.ROADS.filter(r => r.isMainArtery);
    const subRoads = DhanmondiMap.ROADS.filter(r => !r.isMainArtery);
    let id = 0;

    const maxAgents = density === 'low' ? 6 : (density === 'medium' ? 10 : 16);

    // 1. Buses on Main Arteries
    const busCount = density === 'low' ? 2 : (density === 'medium' ? 3 : 5);
    for (let i = 0; i < busCount && i < mainRoads.length; i++) {
      const road = mainRoads[i % mainRoads.length];
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      this.createBusAgent(`traffic_bus_${id++}`, road, (i * 0.3) % 0.9, dir);
    }

    // 2. Green CNGs
    const cngCount = density === 'low' ? 2 : (density === 'medium' ? 3 : 4);
    for (let i = 0; i < cngCount && id < maxAgents; i++) {
      const road = mainRoads[(i + 1) % mainRoads.length];
      const dir: 1 | -1 = i % 2 === 0 ? -1 : 1;
      this.createCNGAgent(`traffic_cng_${id++}`, road, (i * 0.35 + 0.2) % 0.9, dir);
    }

    // 3. Legunas (Human Haulers)
    if (density !== 'low') {
      const legunaCount = density === 'medium' ? 2 : 3;
      for (let i = 0; i < legunaCount && id < maxAgents; i++) {
        const road = mainRoads[(i + 2) % mainRoads.length];
        this.createLegunaAgent(`traffic_leguna_${id++}`, road, (i * 0.4 + 0.1) % 0.9, -1);
      }
    }

    // 4. Cycle Rickshaws
    const rickshawCount = maxAgents - this.agents.length;
    for (let i = 0; i < rickshawCount; i++) {
      const pool = subRoads.length > 0 ? subRoads : mainRoads;
      const road = pool[i % pool.length];
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      this.createRickshawAgent(`traffic_rickshaw_${id++}`, road, (i * 0.25 + 0.1) % 0.85, dir);
    }
  }

  public clearTraffic(): void {
    for (const agent of this.agents) {
      this.scene.remove(agent.mesh);
    }
    this.agents = [];
  }

  public setDensity(density: DensityLevel): void {
    if (this.currentDensity !== density) {
      this.initTraffic(density);
    }
  }

  private createBusAgent(id: string, road: RoadSegment, initialProgress: number, direction: 1 | -1): void {
    const busGroup = new THREE.Group();
    busGroup.name = id;

    const busConfigs = [
      { name: 'ঠিকানা এক্সপ্রেস', route: 'মিরপুর - সায়েন্সল্যাব - মতিঝিল', mainColor: '#008080', stripeColor: '#f1c40f' },
      { name: 'বিকল্প পরিবহন', route: 'মিরপুর ১২ - ধানমন্ডি ২৭ - আজিমপুর', mainColor: '#27ae60', stripeColor: '#e74c3c' },
      { name: 'তরঙ্গ প্লাস', route: 'মোহাম্মদপুর - শংকর - শাহবাগ', mainColor: '#2980b9', stripeColor: '#f39c12' }
    ];
    const cfg = busConfigs[Math.floor(Math.random() * busConfigs.length)];

    const busTex = TextureGenerator.createDhakaBusTexture(cfg.name, cfg.route, cfg.mainColor, cfg.stripeColor);
    const busMat = new THREE.MeshStandardMaterial({ map: busTex, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.8 });

    const busBodyGeo = new THREE.BoxGeometry(2.6, 2.9, 9.5);
    const busMesh = new THREE.Mesh(busBodyGeo, busMat);
    busMesh.position.y = 1.95;
    busMesh.castShadow = true;
    busGroup.add(busMesh);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14);
    wGeo.rotateZ(Math.PI / 2);
    for (const wz of [-3.2, 2.8]) {
      for (const wx of [-1.3, 1.3]) {
        const w = new THREE.Mesh(wGeo, darkMat);
        w.position.set(wx, 0.5, wz);
        busGroup.add(w);
      }
    }

    this.scene.add(busGroup);

    const laneOffset = direction === 1 ? -road.width * 0.28 : road.width * 0.28;

    this.agents.push({
      id,
      type: 'bus',
      mesh: busGroup,
      currentRoad: road,
      progress: initialProgress,
      direction,
      laneOffset,
      speed: 8.5,
      maxSpeed: 9.5,
      length: 9.5,
      width: 2.6
    });
  }

  private createRickshawAgent(id: string, road: RoadSegment, initialProgress: number, direction: 1 | -1): void {
    const rickshaw = new THREE.Group();
    rickshaw.name = id;

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.8, roughness: 0.2 });
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad, roughness: 0.9 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });

    const hoodGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.9, 10, 1, false, -Math.PI / 2, Math.PI);
    hoodGeo.rotateX(Math.PI / 2);
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 1.45, -0.4);
    rickshaw.add(hood);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 0.45), seatMat);
    seat.position.set(0, 0.75, -0.4);
    rickshaw.add(seat);

    // Folk Art Backplate
    const artTex = TextureGenerator.createRickshawArtTexture();
    const artPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.45), new THREE.MeshBasicMaterial({ map: artTex }));
    artPlate.position.set(0, 0.55, -0.72);
    rickshaw.add(artPlate);

    // Rickshaw Puller Mama
    const puller = new THREE.Group();
    puller.position.set(0, 0.9, 0.35);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.18), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8d5524 }));
    head.position.y = 0.3;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.2), new THREE.MeshStandardMaterial({ color: 0x27ae60 }));
    legs.position.y = -0.38;
    puller.add(torso, head, legs);
    rickshaw.add(puller);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 12);
    wGeo.rotateZ(Math.PI / 2);
    const wF = new THREE.Mesh(wGeo, chromeMat);
    wF.position.set(0, 0.38, 1.1);
    const wRL = new THREE.Mesh(wGeo, chromeMat);
    wRL.position.set(-0.48, 0.38, -0.4);
    const wRR = new THREE.Mesh(wGeo, chromeMat);
    wRR.position.set(0.48, 0.38, -0.4);
    rickshaw.add(wF, wRL, wRR);

    this.scene.add(rickshaw);

    const laneOffset = direction === 1 ? -road.width * 0.4 : road.width * 0.4;

    this.agents.push({
      id,
      type: 'rickshaw',
      mesh: rickshaw,
      currentRoad: road,
      progress: initialProgress,
      direction,
      laneOffset,
      speed: 3.5,
      maxSpeed: 4.2,
      length: 2.4,
      width: 1.1
    });
  }

  private createCNGAgent(id: string, road: RoadSegment, initialProgress: number, direction: 1 | -1): void {
    const cngGroup = new THREE.Group();
    cngGroup.name = id;

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x127339, roughness: 0.4 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.9, 2.2), greenMat);
    body.position.y = 0.65;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.5, 2.0), blackMat);
    roof.position.y = 1.35;
    cngGroup.add(body, roof);

    const plateTex = TextureGenerator.createCNGNumberPlateTexture('ঢাকা মেট্রো-থ ১৩-৪৫০২');
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.12), new THREE.MeshBasicMaterial({ map: plateTex }));
    plate.position.set(0, 0.45, 1.12);
    cngGroup.add(plate);

    this.scene.add(cngGroup);

    const laneOffset = direction === 1 ? -road.width * 0.22 : road.width * 0.22;

    this.agents.push({
      id,
      type: 'cng',
      mesh: cngGroup,
      currentRoad: road,
      progress: initialProgress,
      direction,
      laneOffset,
      speed: 9.5,
      maxSpeed: 11.0,
      length: 2.6,
      width: 1.3
    });
  }

  private createLegunaAgent(id: string, road: RoadSegment, initialProgress: number, direction: 1 | -1): void {
    const legunaGroup = new THREE.Group();
    legunaGroup.name = id;

    const silverMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.4 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.5 });

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.4), blueMat);
    cab.position.set(0, 0.9, 1.2);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2.4), silverMat);
    bed.position.set(0, 0.95, -0.7);
    legunaGroup.add(cab, bed);

    this.scene.add(legunaGroup);

    const laneOffset = direction === 1 ? -road.width * 0.24 : road.width * 0.24;

    this.agents.push({
      id,
      type: 'leguna',
      mesh: legunaGroup,
      currentRoad: road,
      progress: initialProgress,
      direction,
      laneOffset,
      speed: 8.8,
      maxSpeed: 10.0,
      length: 4.2,
      width: 1.6
    });
  }

  public update(delta: number, playerPos: THREE.Vector3, maxViewDistance: number = 220): void {
    this.frameCount++;

    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      const distEst = Math.hypot(agent.mesh.position.x - playerPos.x, agent.mesh.position.z - playerPos.z);

      // Distance Culling: hide entities beyond view distance
      if (distEst > maxViewDistance + 30) {
        agent.mesh.visible = false;
        continue;
      }
      agent.mesh.visible = true;

      // Distance Simulation LOD:
      // Near (< 50m): update every frame
      // Mid (50 - 110m): update every 2nd frame
      // Far (> 110m): update every 4th frame
      if (distEst > 110 && (i + this.frameCount) % 4 !== 0) continue;
      if (distEst > 50 && (i + this.frameCount) % 2 !== 0) continue;

      const road = agent.currentRoad;
      const dx = road.end.x - road.start.x;
      const dz = road.end.z - road.start.z;
      const roadLength = Math.hypot(dx, dz);
      const roadAngle = Math.atan2(dx, dz);

      // Compensate delta for skipped frames
      const stepMultiplier = distEst > 110 ? 4 : (distEst > 50 ? 2 : 1);
      const effDelta = delta * stepMultiplier;

      const progressDelta = (agent.speed * effDelta) / roadLength;
      agent.progress += agent.direction * progressDelta;

      if (agent.progress > 0.98) {
        agent.progress = 0.98;
        agent.direction = -1;
        agent.laneOffset = -agent.laneOffset; // Left-side driving swap
      } else if (agent.progress < 0.02) {
        agent.progress = 0.02;
        agent.direction = 1;
        agent.laneOffset = -agent.laneOffset;
      }

      const t = agent.progress;
      const centerX = road.start.x + t * dx;
      const centerZ = road.start.z + t * dz;

      const perpX = Math.cos(roadAngle);
      const perpZ = -Math.sin(roadAngle);

      const agentX = centerX + perpX * agent.laneOffset;
      const agentZ = centerZ + perpZ * agent.laneOffset;

      // Collision avoidance with player only if near
      if (distEst < 45) {
        const distToPlayer = Math.hypot(agentX - playerPos.x, agentZ - playerPos.z);
        if (distToPlayer < agent.length + 2.5) {
          agent.speed = Math.max(0.5, agent.speed - 8.0 * effDelta);
        } else {
          agent.speed = Math.min(agent.maxSpeed, agent.speed + 4.0 * effDelta);
        }
      }

      agent.mesh.position.set(agentX, 0, agentZ);
      agent.mesh.rotation.y = agent.direction === 1 ? roadAngle : roadAngle + Math.PI;
    }
  }

  public getTrafficPositions(): { x: number; z: number; type: string }[] {
    return this.agents.map(a => ({
      x: a.mesh.position.x,
      z: a.mesh.position.z,
      type: a.type
    }));
  }
}
