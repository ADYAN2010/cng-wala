// High-Performance Dhanmondi Open-World Renderer with Spatial Chunking, Instancing & Progressive Streaming
import * as THREE from 'three';
import { DhanmondiMap } from './DhanmondiMap';
import { TextureGenerator } from '../utils/TextureGenerator';
import { CollisionBox } from '../vehicle/VehicleController';
import { GraphicsManager } from '../engine/GraphicsManager';

export interface WorldChunk {
  id: string;
  cx: number;
  cz: number;
  radius: number;
  group: THREE.Group;
  colliders: CollisionBox[];
}

export class WorldManager {
  public scene: THREE.Scene;
  public colliders: CollisionBox[] = [];

  // Animated elements
  public waterMesh: THREE.Mesh | null = null;
  public metroTrainGroup: THREE.Group | null = null;
  public metroTrainZ: number = -350;
  public streetLights: THREE.PointLight[] = [];

  // Spatial Chunks
  public chunks: Map<string, WorldChunk> = new Map();
  public isWorldLoaded: boolean = false;

  // Instanced Meshes for massive draw-call reduction
  private treeKrishTrunks: THREE.InstancedMesh | null = null;
  private treeKrishCanopies: THREE.InstancedMesh | null = null;
  private treePalmTrunks: THREE.InstancedMesh | null = null;
  private treePalmFronds: THREE.InstancedMesh | null = null;
  private treeBanyanTrunks: THREE.InstancedMesh | null = null;
  private treeBanyanCanopies: THREE.InstancedMesh | null = null;
  private streetlightPoles: THREE.InstancedMesh | null = null;
  private streetlightArms: THREE.InstancedMesh | null = null;
  private rooftopTanks: THREE.InstancedMesh | null = null;

  // Materials Cache
  private roadMainMat!: THREE.MeshStandardMaterial;
  private roadSubMat!: THREE.MeshStandardMaterial;
  private roadBridgeMat!: THREE.MeshStandardMaterial;
  private roadZebraMat!: THREE.MeshStandardMaterial;
  private roadBumpMat!: THREE.MeshStandardMaterial;
  private curbMat!: THREE.MeshStandardMaterial;
  private sidewalkMat!: THREE.MeshStandardMaterial;
  private grassMat!: THREE.MeshStandardMaterial;
  private parkGrassMat!: THREE.MeshStandardMaterial;
  private waterMat!: THREE.MeshStandardMaterial;
  private boundaryLineMat!: THREE.LineDashedMaterial;
  private facadeMintMat!: THREE.MeshStandardMaterial;
  private facadeCreamMat!: THREE.MeshStandardMaterial;
  private facadeBlueMat!: THREE.MeshStandardMaterial;
  private facadeBrickMat!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, deferWorldBuild: boolean = true) {
    this.scene = scene;
    this.initMaterials();

    if (!deferWorldBuild) {
      this.buildFullDhanmondiWorld();
    } else {
      // Build lightweight garage/spawn pad for instant Main Menu load
      this.buildLightweightMenuBackdrop();
    }
  }

  private initMaterials(): void {
    this.roadMainMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRoadTexture('main', false, false),
      roughness: 0.65,
      metalness: 0.1
    });

    this.roadSubMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRoadTexture('sub', false, false),
      roughness: 0.8
    });

    this.roadBridgeMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRoadTexture('bridge', false, false),
      roughness: 0.8
    });

    this.roadZebraMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRoadTexture('sub', true, false),
      roughness: 0.8
    });

    this.roadBumpMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRoadTexture('sub', false, true),
      roughness: 0.8
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createCurbTexture(),
      roughness: 0.7
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xc8d6e5, roughness: 0.85 });
    this.grassMat = new THREE.MeshStandardMaterial({ color: 0x44bd32, roughness: 0.95 });
    this.parkGrassMat = new THREE.MeshStandardMaterial({ color: 0x2ed573, roughness: 0.9 });

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x00a8ff,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.88
    });

    this.boundaryLineMat = new THREE.LineDashedMaterial({
      color: 0xe84118,
      linewidth: 4,
      scale: 1,
      dashSize: 8,
      gapSize: 4
    });

    this.facadeMintMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createBuildingFacadeTexture('residential_mint'),
      roughness: 0.6
    });
    this.facadeCreamMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createBuildingFacadeTexture('residential_cream'),
      roughness: 0.6
    });
    this.facadeBlueMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createBuildingFacadeTexture('commercial_blue'),
      roughness: 0.4,
      metalness: 0.3
    });
    this.facadeBrickMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createBuildingFacadeTexture('brick'),
      roughness: 0.8
    });
  }

  // Lightweight immediate garage scene for the starting menu
  private buildLightweightMenuBackdrop(): void {
    const previewGround = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      this.grassMat
    );
    previewGround.rotateX(-Math.PI / 2);
    previewGround.position.set(-160, -0.05, 180);
    previewGround.receiveShadow = true;
    previewGround.name = 'menu_preview_ground';
    this.scene.add(previewGround);

    // Realistic asphalt roadway preview
    const roadPreview = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 60),
      this.roadMainMat
    );
    roadPreview.rotateX(-Math.PI / 2);
    roadPreview.position.set(-160, 0.02, 180);
    roadPreview.receiveShadow = true;
    roadPreview.name = 'menu_preview_road';
    this.scene.add(roadPreview);

    // Stand curb pad
    const standPad = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.22, 60),
      this.sidewalkMat
    );
    standPad.position.set(-170, 0.11, 180);
    standPad.receiveShadow = true;
    standPad.name = 'menu_preview_pad';
    this.scene.add(standPad);
  }

  // Progressive Asynchronous World Generator
  public async buildWorldProgressively(onProgress?: (percent: number, stepText: string) => void): Promise<void> {
    if (this.isWorldLoaded) return;

    const report = (pct: number, msg: string) => {
      if (onProgress) onProgress(pct, msg);
    };

    // Remove menu preview meshes
    const prevGround = this.scene.getObjectByName('menu_preview_ground');
    if (prevGround) this.scene.remove(prevGround);
    const prevRoad = this.scene.getObjectByName('menu_preview_road');
    if (prevRoad) this.scene.remove(prevRoad);
    const prevPad = this.scene.getObjectByName('menu_preview_pad');
    if (prevPad) this.scene.remove(prevPad);

    report(10, 'ধানমন্ডি লেক ও ভূপ্রকৃতি প্রস্তুত... (Lake & Terrain)');
    await this.yieldFrame();
    this.buildTerrainAndLake();
    this.buildDhanmondiBoundaryMarker();

    report(30, 'সাত মসজিদ ও মিরপুর রোড নেটওয়ার্ক স্থাপন... (Roads & Sidewalks)');
    await this.yieldFrame();
    this.buildCompleteRoadNetwork();

    report(50, 'মেট্রোরেল ভায়াডাক্ট ও এমআরটি ট্রেন চালু... (Dhaka Metro Viaduct)');
    await this.yieldFrame();
    this.buildMetroRailViaduct();

    report(70, 'আবাসিক ও বাণিজ্যিক ভবন ব্লক তৈরি হচ্ছে... (Neighborhood Chunks)');
    await this.yieldFrame();
    this.buildAllNeighborhoodBlocks();

    report(85, 'আবাহনী স্টেডিয়াম ও রবীন্দ্র সরোবর প্রাঙ্গণ... (Landmarks & Parks)');
    await this.yieldFrame();
    this.buildAbahaniClubStadium();
    this.buildRabindraSarobarAmphitheater();
    this.buildSpecializedHospitalsAndShopping();

    report(95, 'গাছপালা, সড়কবাতি ও দোকানপাট বিন্যাস... (Instanced Props & Trees)');
    await this.yieldFrame();
    this.buildStreetLifeAndFoliage();

    this.isWorldLoaded = true;
    report(100, 'ধানমন্ডি শিফট সম্পূর্ণ প্রস্তুত! (World Ready)');
    await this.yieldFrame();
  }

  private yieldFrame(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => resolve());
    });
  }

  public buildFullDhanmondiWorld(): void {
    this.buildTerrainAndLake();
    this.buildDhanmondiBoundaryMarker();
    this.buildCompleteRoadNetwork();
    this.buildMetroRailViaduct();
    this.buildAllNeighborhoodBlocks();
    this.buildAbahaniClubStadium();
    this.buildRabindraSarobarAmphitheater();
    this.buildSpecializedHospitalsAndShopping();
    this.buildStreetLifeAndFoliage();
    this.isWorldLoaded = true;
  }

  // 1. Terrain & Organic Dhanmondi Lake
  private buildTerrainAndLake(): void {
    const groundGeo = new THREE.PlaneGeometry(650, 750);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.grassMat);
    ground.position.set(10, -0.06, -10);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const lakeShape = new THREE.Shape();
    lakeShape.moveTo(-35, -230);
    lakeShape.bezierCurveTo(-10, -210, 20, -180, 25, -120);
    lakeShape.bezierCurveTo(30, -70, 38, 0, 42, 60);
    lakeShape.bezierCurveTo(45, 110, 38, 150, 30, 190);
    lakeShape.lineTo(15, 210);
    lakeShape.bezierCurveTo(5, 175, 0, 150, -5, 150);
    lakeShape.bezierCurveTo(-10, 150, -15, 175, -25, 210);
    lakeShape.lineTo(-38, 190);
    lakeShape.bezierCurveTo(-42, 140, -40, 80, -38, 0);
    lakeShape.bezierCurveTo(-38, -60, -40, -140, -35, -230);
    lakeShape.closePath();

    const waterGeo = new THREE.ShapeGeometry(lakeShape);
    waterGeo.rotateX(-Math.PI / 2);
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.position.set(0, -0.02, 0);
    this.scene.add(this.waterMesh);

    // Lake Water Collision Boundaries
    this.colliders.push(
      { minX: -36, maxX: 26, minZ: -225, maxZ: -60, isWater: true },
      { minX: -39, maxX: 39, minZ: -60, maxZ: 62, isWater: true },
      { minX: -40, maxX: 42, minZ: 78, maxZ: 185, isWater: true },
      { minX: -36, maxX: 28, minZ: 185, maxZ: 215, isWater: true }
    );

    const promenadeMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.8 });
    const pWest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 420), promenadeMat);
    pWest.position.set(-41, 0.2, -15);
    const pEast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 420), promenadeMat);
    pEast.position.set(41, 0.2, -15);
    this.scene.add(pWest, pEast);
  }

  // 2. Red Dashed Area Boundary Line (Developer Debug Only)
  private buildDhanmondiBoundaryMarker(): void {
    if (!GraphicsManager.getInstance().settings.showDevOverlay) return;
    const b = DhanmondiMap.BOUNDS;
    const boundaryPoints = [
      new THREE.Vector3(b.minX, 0.25, b.minZ),
      new THREE.Vector3(b.maxX - 30, 0.25, b.minZ),
      new THREE.Vector3(b.maxX, 0.25, -160),
      new THREE.Vector3(b.maxX, 0.25, b.maxZ),
      new THREE.Vector3(b.minX + 20, 0.25, b.maxZ),
      new THREE.Vector3(b.minX, 0.25, 180),
      new THREE.Vector3(b.minX, 0.25, b.minZ)
    ];

    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryLine = new THREE.Line(boundaryGeo, this.boundaryLineMat);
    boundaryLine.computeLineDistances();
    this.scene.add(boundaryLine);
  }

  // 3. Complete Drivable Road Network
  private buildCompleteRoadNetwork(): void {
    for (const road of DhanmondiMap.ROADS) {
      const dx = road.end.x - road.start.x;
      const dz = road.end.z - road.start.z;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const midX = (road.start.x + road.end.x) / 2;
      const midZ = (road.start.z + road.end.z) / 2;

      let roadMat = this.roadSubMat;
      if (road.roadType === 'main') {
        roadMat = this.roadMainMat;
      } else if (road.roadType === 'bridge') {
        roadMat = this.roadBridgeMat;
      }

      const roadGeo = new THREE.PlaneGeometry(road.width, length);
      roadGeo.rotateX(-Math.PI / 2);
      roadGeo.rotateY(angle);

      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.position.set(midX, 0.02, midZ);
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);

      // Sidewalks
      const swWidth = road.isMainArtery ? 2.6 : 1.8;
      const swHeight = 0.22;
      const swGeo = new THREE.BoxGeometry(swWidth, swHeight, length);
      swGeo.rotateY(angle);

      const normX = Math.cos(angle);
      const normZ = -Math.sin(angle);
      const offsetDist = road.width / 2 + swWidth / 2;

      const swLeft = new THREE.Mesh(swGeo, this.sidewalkMat);
      swLeft.position.set(midX - normX * offsetDist, swHeight / 2, midZ - normZ * offsetDist);
      swLeft.receiveShadow = true;
      this.scene.add(swLeft);

      const swRight = new THREE.Mesh(swGeo, this.sidewalkMat);
      swRight.position.set(midX + normX * offsetDist, swHeight / 2, midZ + normZ * offsetDist);
      swRight.receiveShadow = true;
      this.scene.add(swRight);

      // Central median on main arteries (Concrete curb with planted green hedge)
      if (road.isMainArtery && road.width >= 14) {
        const medianW = 1.4;
        const medianH = 0.26;
        const medianGeo = new THREE.BoxGeometry(medianW, medianH, length);
        medianGeo.rotateY(angle);
        const curbMat = new THREE.MeshStandardMaterial({ color: 0x576574, roughness: 0.8 });
        const medianCurb = new THREE.Mesh(medianGeo, curbMat);
        medianCurb.position.set(midX, medianH / 2, midZ);
        medianCurb.receiveShadow = true;

        // Dark green hedge top
        const hedgeGeo = new THREE.BoxGeometry(medianW - 0.25, 0.22, length);
        hedgeGeo.rotateY(angle);
        const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x1e824c, roughness: 0.95 });
        const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
        hedge.position.set(midX, medianH + 0.11, midZ);
        hedge.receiveShadow = true;

        this.scene.add(medianCurb, hedge);
      }
    }

    this.buildLakeBridgeStructure();

    // Zebra Crossings
    const zebraCrossings = [
      { x: -160, z: -255, w: 15, l: 4 },
      { x: -160, z: -155, w: 15, l: 4 },
      { x: -160, z: -55, w: 15, l: 4 },
      { x: -160, z: 65, w: 15, l: 4 },
      { x: -160, z: 235, w: 15, l: 4 },
      { x: 160, z: -255, w: 17, l: 4 },
      { x: 160, z: -65, w: 17, l: 4 },
      { x: 160, z: 65, w: 17, l: 4 },
      { x: 160, z: 235, w: 17, l: 4 }
    ];

    for (const zc of zebraCrossings) {
      const zGeo = new THREE.PlaneGeometry(zc.w, zc.l);
      zGeo.rotateX(-Math.PI / 2);
      const zMesh = new THREE.Mesh(zGeo, this.roadZebraMat);
      zMesh.position.set(zc.x, 0.03, zc.z);
      this.scene.add(zMesh);
    }
  }

  private buildLakeBridgeStructure(): void {
    const bridgeY = 0.6;
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'Lake_Bridge_Structure';

    const archMat = new THREE.MeshStandardMaterial({ color: 0xb33927, roughness: 0.8 });
    const archPillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.5, 12);
    for (const px of [-25, 0, 25]) {
      const pL = new THREE.Mesh(archPillarGeo, archMat);
      pL.position.set(px, -0.8, 66);
      const pR = new THREE.Mesh(archPillarGeo, archMat);
      pR.position.set(px, -0.8, 74);
      bridgeGroup.add(pL, pR);
    }

    const railMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.8 });
    const railGeo = new THREE.BoxGeometry(90, 0.9, 0.15);
    const railNorth = new THREE.Mesh(railGeo, railMat);
    railNorth.position.set(0, bridgeY + 0.5, 65.8);
    const railSouth = new THREE.Mesh(railGeo, railMat);
    railSouth.position.set(0, bridgeY + 0.5, 74.2);
    bridgeGroup.add(railNorth, railSouth);

    this.scene.add(bridgeGroup);
  }

  // 4. Dhaka Metro Rail Viaduct (MRT Line 6)
  private buildMetroRailViaduct(): void {
    const viaductGroup = new THREE.Group();
    viaductGroup.name = 'Dhaka_Metro_MRT6';

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, roughness: 0.6 });
    const viaductLength = 260;
    const viaductH = 8.5;

    const vGeo = new THREE.BoxGeometry(6.6, 1.4, viaductLength);
    const vMesh = new THREE.Mesh(vGeo, concreteMat);
    vMesh.position.set(240, viaductH, -320);
    vMesh.rotation.y = -Math.PI / 4;
    vMesh.castShadow = true;
    viaductGroup.add(vMesh);

    const pierGeo = new THREE.CylinderGeometry(1.4, 1.6, viaductH, 14);
    for (let i = -100; i <= 100; i += 35) {
      const px = 240 + i * Math.sin(-Math.PI / 4);
      const pz = -320 + i * Math.cos(-Math.PI / 4);
      const pier = new THREE.Mesh(pierGeo, concreteMat);
      pier.position.set(px, viaductH / 2, pz);
      pier.castShadow = true;
      viaductGroup.add(pier);

      this.colliders.push({ minX: px - 1.6, maxX: px + 1.6, minZ: pz - 1.6, maxZ: pz + 1.6 });
    }

    this.scene.add(viaductGroup);

    this.metroTrainGroup = this.buildMetroTrainModel();
    this.metroTrainGroup.position.set(240, viaductH + 0.9, -320);
    this.metroTrainGroup.rotation.y = -Math.PI / 4;
    this.scene.add(this.metroTrainGroup);
  }

  private buildMetroTrainModel(): THREE.Group {
    const train = new THREE.Group();
    const carLength = 14;
    const numCars = 4;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.3 });
    const greenStripeMat = new THREE.MeshStandardMaterial({ color: 0x008037 });
    const redStripeMat = new THREE.MeshStandardMaterial({ color: 0xda291c });
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.1 });

    for (let c = 0; c < numCars; c++) {
      const car = new THREE.Group();
      car.position.z = c * (carLength + 0.4);

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, carLength), bodyMat);
      bMesh.position.y = 1.3;
      const gStripe = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.45, carLength), greenStripeMat);
      gStripe.position.y = 0.9;
      const rStripe = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.12, carLength), redStripeMat);
      rStripe.position.y = 1.25;
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.8, carLength - 1.4), winMat);
      win.position.y = 1.8;

      car.add(bMesh, gStripe, rStripe, win);
      train.add(car);
    }
    return train;
  }

  // 5. Spatial Chunk Creation & Building Placement
  private getChunk(cx: number, cz: number): WorldChunk {
    const key = `${cx}_${cz}`;
    if (this.chunks.has(key)) return this.chunks.get(key)!;

    const group = new THREE.Group();
    group.name = `WorldChunk_${key}`;
    this.scene.add(group);

    const chunk: WorldChunk = {
      id: key,
      cx: cx * 70 + 35,
      cz: cz * 70 + 35,
      radius: 55,
      group,
      colliders: []
    };
    this.chunks.set(key, chunk);
    return chunk;
  }

  private assignToChunk(x: number, z: number, obj: THREE.Object3D, col?: CollisionBox): void {
    const cx = Math.floor(x / 70);
    const cz = Math.floor(z / 70);
    const chunk = this.getChunk(cx, cz);
    chunk.group.add(obj);
    if (col) {
      chunk.colliders.push(col);
      this.colliders.push(col);
    }
  }

  private buildAllNeighborhoodBlocks(): void {
    const shopTextures = TextureGenerator.getDhanmondiShopTextures();
    let shopIdx = 0;

    // A. West Commercial Block: Satmasjid Road Exterior (X = -185)
    for (let z = -260; z <= 240; z += 28) {
      if (Math.abs(z - (-260)) < 16 || Math.abs(z - (-160)) < 14 || Math.abs(z - (-60)) < 14 || Math.abs(z - 70) < 14 || Math.abs(z - 240) < 16) {
        continue;
      }
      this.createChunkBuilding(-185, z, 22, 24, Math.random() * 16 + 18, (z % 2 === 0) ? this.facadeBlueMat : this.facadeMintMat);

      // Bengali Signboard
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), new THREE.MeshBasicMaterial({ map: shopTextures[shopIdx++ % shopTextures.length] }));
      sign.position.set(-173.8, 3.2, z);
      sign.rotation.y = Math.PI / 2;
      this.assignToChunk(-185, z, sign);
    }

    // B. Residential Blocks between Satmasjid Road and Dhanmondi Lake (X = -135 to -75)
    for (let x = -135; x <= -75; x += 30) {
      for (let z = -240; z <= 220; z += 32) {
        if (Math.abs(z - (-160)) < 14 || Math.abs(z - (-60)) < 14 || Math.abs(z - 70) < 14 || Math.abs(z - 240) < 16) continue;
        if (x > -145 && x < -75 && z > -50 && z < 40) continue; // Abahani Club area

        const mat = (x + z) % 3 === 0 ? this.facadeBrickMat : (x + z) % 2 === 0 ? this.facadeMintMat : this.facadeCreamMat;
        this.createChunkBuilding(x, z, 20, 22, Math.random() * 14 + 14, mat);
      }
    }

    // C. East Residential Blocks between Dhanmondi Lake and Mirpur Road (X = 75 to 135)
    for (let x = 75; x <= 135; x += 30) {
      for (let z = -240; z <= 220; z += 32) {
        if (Math.abs(z - (-160)) < 14 || Math.abs(z - (-70)) < 14 || Math.abs(z - 70) < 14 || Math.abs(z - 240) < 16) continue;
        if (x < 95 && z > 40 && z < 110) continue; // Rabindra Sarobar grounds

        const mat = (x + z) % 2 === 0 ? this.facadeCreamMat : this.facadeMintMat;
        this.createChunkBuilding(x, z, 20, 22, Math.random() * 14 + 14, mat);
      }
    }

    // D. East Commercial Strip along Mirpur Road Exterior (X = 185)
    for (let z = -260; z <= 240; z += 30) {
      if (Math.abs(z - (-260)) < 16 || Math.abs(z - (-70)) < 14 || Math.abs(z - 70) < 14 || Math.abs(z - 240) < 16) continue;
      this.createChunkBuilding(185, z, 22, 24, Math.random() * 18 + 20, this.facadeBlueMat);

      const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), new THREE.MeshBasicMaterial({ map: shopTextures[shopIdx++ % shopTextures.length] }));
      sign.position.set(173.8, 3.2, z);
      sign.rotation.y = -Math.PI / 2;
      this.assignToChunk(185, z, sign);
    }
  }

  private createChunkBuilding(x: number, z: number, w: number, d: number, h: number, mat: THREE.MeshStandardMaterial): void {
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(x, 0, z);

    // Realistic 6-sided texturing: Facade windows on walls, concrete on roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8395a7, roughness: 0.85 });
    const materials = [mat, mat, roofMat, roofMat, mat, mat];

    const bGeo = new THREE.BoxGeometry(w, h, d);
    const bMesh = new THREE.Mesh(bGeo, materials);
    bMesh.position.y = h / 2;
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    buildingGroup.add(bMesh);

    // Rooftop water tank (Sintex blue plastic tank common on Dhaka rooftops)
    const tankGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.4, 8);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.5 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(w * 0.22, h + 0.7, d * 0.22);
    buildingGroup.add(tank);

    // Rooftop stairwell headhouse / lift room
    const stairGeo = new THREE.BoxGeometry(Math.min(w * 0.35, 4.0), 2.2, Math.min(d * 0.35, 4.0));
    const stairMesh = new THREE.Mesh(stairGeo, roofMat);
    stairMesh.position.set(-w * 0.18, h + 1.1, -d * 0.18);
    buildingGroup.add(stairMesh);

    const col: CollisionBox = {
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2
    };

    this.assignToChunk(x, z, buildingGroup, col);
  }

  // 6. Abahani Club Stadium
  private buildAbahaniClubStadium(): void {
    const posX = -110;
    const posZ = -10;
    const w = 65;
    const d = 48;

    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.parkGrassMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(posX, 0.05, posZ);
    this.assignToChunk(posX, posZ, pitch);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, 0.6), wallMat);
    wallN.position.set(posX, 1.3, posZ - d / 2);
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, 0.6), wallMat);
    wallS.position.set(posX, 1.3, posZ + d / 2);
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.6, d), wallMat);
    wallE.position.set(posX + w / 2, 1.3, posZ);
    this.assignToChunk(posX, posZ, wallN);
    this.assignToChunk(posX, posZ, wallS);
    this.assignToChunk(posX, posZ, wallE);

    const signTex = TextureGenerator.createShopSignboardTexture('আবাহনী ক্রীড়াচক্র', 'ঐতিহাসিক স্টেডিয়াম ও স্পোর্টস কমপ্লেক্স', 'Abahani Sports Club Stadium', '#2980b9');
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.2), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(posX, 4.5, posZ - d / 2 - 0.35);
    this.assignToChunk(posX, posZ, sign);

    this.colliders.push(
      { minX: posX - w / 2, maxX: posX + w / 2, minZ: posZ - d / 2 - 1, maxZ: posZ - d / 2 + 1 },
      { minX: posX - w / 2, maxX: posX + w / 2, minZ: posZ + d / 2 - 1, maxZ: posZ + d / 2 + 1 }
    );
  }

  // 7. Rabindra Sarobar Amphitheater
  private buildRabindraSarobarAmphitheater(): void {
    const posX = 65;
    const posZ = 75;

    const stepMat = new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.8 });
    for (let s = 0; s < 6; s++) {
      const radius = 24 - s * 3.4;
      const stepGeo = new THREE.CylinderGeometry(radius, radius, 0.45, 20, 1, false, Math.PI * 0.3, Math.PI * 1.4);
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(posX, s * 0.45 + 0.25, posZ);
      this.assignToChunk(posX, posZ, stepMesh);
    }

    this.createTongDokan(posX - 12, posZ - 14);
    this.createTongDokan(posX + 10, posZ + 14);
    this.createStreetVendorCart(posX - 6, posZ + 18, 'fuchka');
    this.createStreetVendorCart(posX + 16, posZ - 8, 'fruit');
  }

  // 8. Specialized Hospitals & Rapa Plaza
  private buildSpecializedHospitalsAndShopping(): void {
    this.buildLandmarkComplex(-80, -280, 36, 26, 30, 'রাপা প্লাজা শপিং কমপ্লেক্স', 'Rapa Plaza Mall - Road 27', '#8e44ad');
    this.buildLandmarkComplex(-185, 50, 30, 24, 28, 'ইবনে সিনা স্পেশালাইজড হাসপাতাল', 'IBN Sina Hospital', '#16a085');
    this.buildLandmarkComplex(-185, -200, 26, 22, 24, 'বাংলাদেশ আই হাসপাতাল', 'Bangladesh Eye Hospital', '#2980b9');
    this.buildLandmarkComplex(-185, -280, 28, 24, 26, 'সিটি হাসপাতাল ও ডায়াগনস্টিক', 'City Hospital', '#d35400');
    this.buildLandmarkComplex(185, 70, 32, 26, 32, 'ল্যাবএইড স্পেশালাইজড হাসপাতাল', 'LABAID Specialized Hospital', '#c0392b');
    this.buildLandmarkComplex(100, -95, 26, 24, 18, 'ধানমন্ডি ৩২ স্মৃতি জাদুঘর', 'Dhanmondi 32 Historic Zone', '#34495e');
  }

  private buildLandmarkComplex(x: number, z: number, w: number, d: number, h: number, titleBn: string, titleEn: string, themeColor: string): void {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, this.facadeBlueMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;

    const signTex = TextureGenerator.createShopSignboardTexture(titleBn, 'বিশেষায়িত প্রতিষ্ঠান', titleEn, themeColor);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.2), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(x, 12, z + d / 2 + 0.15);

    const col: CollisionBox = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
    this.assignToChunk(x, z, mesh, col);
    this.assignToChunk(x, z, sign);
  }

  // 9. Instanced Trees, Streetlights & Dhaka Streetlife
  private buildStreetLifeAndFoliage(): void {
    // Roadside Tong stalls and street vendors
    this.createTongDokan(-148, -112);
    this.createTongDokan(-148, 72);
    this.createTongDokan(-148, 175);
    this.createTongDokan(-148, 230);
    this.createStreetVendorCart(-148, -118, 'fruit');
    this.createStreetVendorCart(-148, 64, 'fuchka');
    this.createStreetVendorCart(-148, 182, 'fruit');

    this.createSpeedBreaker(-105, -160, 9);
    this.createSpeedBreaker(-105, -60, 9);
    this.createSpeedBreaker(95, -70, 9);
    this.createSpeedBreaker(95, 70, 9);

    // Streetlights along main avenues
    this.buildStreetlightsAndUtilityPoles();

    // Build Instanced Trees along Lakeside Promenades & Sidewalks
    this.buildInstancedFoliage();
  }

  // Streetlights & Concrete Electrical Poles with Overhead Crossarms
  private buildStreetlightsAndUtilityPoles(): void {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3d4449, roughness: 0.6, metalness: 0.4 });
    const lampEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xfffa65,
      emissive: 0xffeaa7,
      emissiveIntensity: 1.5
    });
    const utilityMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.85 });

    const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 6.2, 8);
    const armGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
    const headGeo = new THREE.BoxGeometry(0.45, 0.18, 0.3);

    // Streetlights along Satmasjid Road (West side x = -170.2, East side x = -149.8)
    for (let z = -250; z <= 235; z += 34) {
      // West Streetlight (arm points towards road, +X)
      const westLight = new THREE.Group();
      const pWest = new THREE.Mesh(poleGeo, poleMat);
      pWest.position.y = 3.1;
      const aWest = new THREE.Mesh(armGeo, poleMat);
      aWest.position.set(0.8, 6.0, 0);
      const hWest = new THREE.Mesh(headGeo, lampEmissiveMat);
      hWest.position.set(1.5, 5.9, 0);
      westLight.add(pWest, aWest, hWest);
      westLight.position.set(-170.2, 0, z);
      this.assignToChunk(-170.2, z, westLight);

      // East Streetlight (arm points towards road, -X)
      const eastLight = new THREE.Group();
      const pEast = new THREE.Mesh(poleGeo, poleMat);
      pEast.position.y = 3.1;
      const aEast = new THREE.Mesh(armGeo, poleMat);
      aEast.position.set(-0.8, 6.0, 0);
      const hEast = new THREE.Mesh(headGeo, lampEmissiveMat);
      hEast.position.set(-1.5, 5.9, 0);
      eastLight.add(pEast, aEast, hEast);
      eastLight.position.set(-149.8, 0, z);
      this.assignToChunk(-149.8, z, eastLight);
    }

    // Streetlights along Mirpur Road
    for (let z = -250; z <= 235; z += 36) {
      const westLight = new THREE.Group();
      const pWest = new THREE.Mesh(poleGeo, poleMat);
      pWest.position.y = 3.1;
      const aWest = new THREE.Mesh(armGeo, poleMat);
      aWest.position.set(0.8, 6.0, 0);
      const hWest = new THREE.Mesh(headGeo, lampEmissiveMat);
      hWest.position.set(1.5, 5.9, 0);
      westLight.add(pWest, aWest, hWest);
      westLight.position.set(149.8, 0, z);
      this.assignToChunk(149.8, z, westLight);
    }

    // Concrete Electrical Utility Poles along Satmasjid Road
    const utilPoleGeo = new THREE.CylinderGeometry(0.14, 0.18, 7.5, 8);
    const crossArmGeo = new THREE.BoxGeometry(1.8, 0.12, 0.12);

    for (let z = -240; z <= 220; z += 44) {
      const utilGroup = new THREE.Group();
      const uPole = new THREE.Mesh(utilPoleGeo, utilityMat);
      uPole.position.y = 3.75;
      const cross1 = new THREE.Mesh(crossArmGeo, utilityMat);
      cross1.position.set(0, 6.8, 0);
      const cross2 = new THREE.Mesh(crossArmGeo, utilityMat);
      cross2.position.set(0, 6.2, 0);
      utilGroup.add(uPole, cross1, cross2);
      utilGroup.position.set(-171.8, 0, z);
      this.assignToChunk(-171.8, z, utilGroup);
    }
  }

  private buildInstancedFoliage(): void {
    const treePositions: Array<{ x: number; z: number; type: 'krishnachura' | 'palm' | 'banyan' }> = [];

    // Along Lake drives
    for (let z = -220; z <= 180; z += 24) {
      treePositions.push({ x: -48, z, type: z % 2 === 0 ? 'krishnachura' : 'banyan' });
      treePositions.push({ x: 48, z, type: z % 3 === 0 ? 'palm' : 'krishnachura' });
    }

    // Along Satmasjid Road sidewalks
    for (let z = -240; z <= 230; z += 28) {
      treePositions.push({ x: -171.2, z, type: z % 56 === 0 ? 'krishnachura' : 'banyan' });
      treePositions.push({ x: -148.8, z, type: z % 56 === 0 ? 'palm' : 'krishnachura' });
    }

    // Along Satmasjid central green median
    for (let z = -240; z <= 220; z += 40) {
      treePositions.push({ x: -160, z, type: 'palm' });
    }

    // Along Mirpur Road sidewalks
    for (let z = -240; z <= 230; z += 32) {
      treePositions.push({ x: 148.8, z, type: 'krishnachura' });
      treePositions.push({ x: 171.2, z, type: 'palm' });
    }

    // Around Sarobar
    treePositions.push(
      { x: 49, z: 65, type: 'krishnachura' },
      { x: 85, z: 59, type: 'krishnachura' },
      { x: 47, z: 91, type: 'banyan' },
      { x: 83, z: 95, type: 'palm' }
    );

    const krishList = treePositions.filter(t => t.type === 'krishnachura');
    const palmList = treePositions.filter(t => t.type === 'palm');
    const banyanList = treePositions.filter(t => t.type === 'banyan');

    // 1. Krishnachura Instanced
    if (krishList.length > 0) {
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 4.5, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18 });
      this.treeKrishTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, krishList.length);

      const canGeo = new THREE.SphereGeometry(2.4, 7, 7);
      canGeo.scale(1.4, 0.7, 1.4);
      const canMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
      this.treeKrishCanopies = new THREE.InstancedMesh(canGeo, canMat, krishList.length);

      const dummy = new THREE.Object3D();
      krishList.forEach((t, i) => {
        dummy.position.set(t.x, 2.25, t.z);
        dummy.updateMatrix();
        this.treeKrishTrunks!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, 5.2, t.z);
        dummy.updateMatrix();
        this.treeKrishCanopies!.setMatrixAt(i, dummy.matrix);
      });

      this.treeKrishTrunks.instanceMatrix.needsUpdate = true;
      this.treeKrishCanopies.instanceMatrix.needsUpdate = true;
      this.scene.add(this.treeKrishTrunks, this.treeKrishCanopies);
    }

    // 2. Palm Instanced
    if (palmList.length > 0) {
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 7.5, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18 });
      this.treePalmTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmList.length);

      const topGeo = new THREE.ConeGeometry(2.0, 1.2, 7);
      const topMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
      this.treePalmFronds = new THREE.InstancedMesh(topGeo, topMat, palmList.length);

      const dummy = new THREE.Object3D();
      palmList.forEach((t, i) => {
        dummy.position.set(t.x, 3.75, t.z);
        dummy.updateMatrix();
        this.treePalmTrunks!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, 7.6, t.z);
        dummy.updateMatrix();
        this.treePalmFronds!.setMatrixAt(i, dummy.matrix);
      });

      this.treePalmTrunks.instanceMatrix.needsUpdate = true;
      this.treePalmFronds.instanceMatrix.needsUpdate = true;
      this.scene.add(this.treePalmTrunks, this.treePalmFronds);
    }

    // 3. Banyan Instanced
    if (banyanList.length > 0) {
      const trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 4.0, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18 });
      this.treeBanyanTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, banyanList.length);

      const canGeo = new THREE.SphereGeometry(3.2, 7, 7);
      canGeo.scale(1.5, 0.8, 1.5);
      const canMat = new THREE.MeshStandardMaterial({ color: 0x1b7a3e });
      this.treeBanyanCanopies = new THREE.InstancedMesh(canGeo, canMat, banyanList.length);

      const dummy = new THREE.Object3D();
      banyanList.forEach((t, i) => {
        dummy.position.set(t.x, 2.0, t.z);
        dummy.updateMatrix();
        this.treeBanyanTrunks!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, 5.0, t.z);
        dummy.updateMatrix();
        this.treeBanyanCanopies!.setMatrixAt(i, dummy.matrix);
      });

      this.treeBanyanTrunks.instanceMatrix.needsUpdate = true;
      this.treeBanyanCanopies.instanceMatrix.needsUpdate = true;
      this.scene.add(this.treeBanyanTrunks, this.treeBanyanCanopies);
    }
  }

  private createTongDokan(x: number, z: number): void {
    const tong = new THREE.Group();
    tong.position.set(x, 0, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const tinMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.6 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.4), woodMat);
    base.position.y = 0.45;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.8), tinMat);
    roof.position.set(0, 2.2, 0);
    roof.rotation.x = 0.12;
    tong.add(base, roof);

    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.8 }));
    kettle.position.set(0.4, 1.05, 0);
    tong.add(kettle);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.35), woodMat);
    bench.position.set(0, 0.22, 1.2);
    tong.add(bench);

    const col: CollisionBox = { minX: x - 1.4, maxX: x + 1.4, minZ: z - 1.0, maxZ: z + 1.6 };
    this.assignToChunk(x, z, tong, col);
  }

  private createStreetVendorCart(x: number, z: number, type: 'fuchka' | 'fruit'): void {
    const cart = new THREE.Group();
    cart.position.set(x, 0, z);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.9), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
    body.position.y = 0.55;
    cart.add(body);

    if (type === 'fuchka') {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xd4ac0d }));
      cone.position.set(0, 1.1, 0);
      cart.add(cone);
    } else {
      const dabMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
      for (let i = -0.3; i <= 0.3; i += 0.2) {
        const dab = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), dabMat);
        dab.position.set(i, 0.98, 0);
        cart.add(dab);
      }
    }
    this.assignToChunk(x, z, cart);
  }

  private createSpeedBreaker(x: number, z: number, width: number): void {
    const bumpGeo = new THREE.CylinderGeometry(0.2, 0.2, width, 10, 1, false, 0, Math.PI);
    bumpGeo.rotateZ(Math.PI / 2);
    const bump = new THREE.Mesh(bumpGeo, new THREE.MeshStandardMaterial({ color: 0xf1c40f }));
    bump.position.set(x, 0.06, z);
    this.assignToChunk(x, z, bump);
  }

  // Update per frame: Metro train, water shimmer, and chunk culling
  public update(delta: number, playerPos?: THREE.Vector3, viewDistance: number = 220): void {
    // 1. Metro train movement
    if (this.metroTrainGroup) {
      const trainSpeed = 26.0;
      this.metroTrainZ += trainSpeed * delta;
      if (this.metroTrainZ > -150) {
        this.metroTrainZ = -450;
      }
      this.metroTrainGroup.position.z = this.metroTrainZ;
      this.metroTrainGroup.position.x = 240 + (this.metroTrainZ - (-320)) * Math.tan(-Math.PI / 4);
    }

    // 2. Lake water shimmer
    if (this.waterMesh) {
      this.waterMesh.position.y = -0.02 + Math.sin(Date.now() * 0.002) * 0.035;
    }

    // 3. Dynamic Chunk Culling
    if (playerPos && this.chunks.size > 0) {
      let activeCount = 0;
      const cullDist = viewDistance + 35;

      for (const chunk of this.chunks.values()) {
        const d = Math.hypot(chunk.cx - playerPos.x, chunk.cz - playerPos.z);
        if (d > cullDist) {
          chunk.group.visible = false;
        } else {
          chunk.group.visible = true;
          activeCount++;
        }
      }

      GraphicsManager.getInstance().activeChunksCount = activeCount;
    }
  }

  public setStreetlightsActive(active: boolean): void {
    const val = active ? 2.2 : 0;
    for (const l of this.streetLights) l.intensity = val;
  }
}
