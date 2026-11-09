// Procedural Texture Generator matching the Illustrated Dhanmondi Game Map Art Direction
import * as THREE from 'three';

export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  // Create a safe 1x1 fallback texture if procedural canvas creation fails
  public static createFallbackTexture(color: string = '#2c3e50'): THREE.CanvasTexture {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 4, 4);
      }
      return new THREE.CanvasTexture(canvas);
    } catch {
      return new THREE.CanvasTexture(document.createElement('canvas'));
    }
  }

  // Create realistic dark asphalt road texture with authentic road markings
  public static createRoadTexture(
    type: 'main' | 'sub' | 'bridge' = 'main',
    hasZebra: boolean = false,
    hasSpeedBump: boolean = false
  ): THREE.CanvasTexture {
    const key = `road_${type}_${hasZebra}_${hasSpeedBump}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (type === 'main') {
      // 1. Realistic Dark Asphalt Base (#22272b)
      ctx.fillStyle = '#22272b';
      ctx.fillRect(0, 0, width, height);

      // Asphalt texture aggregate noise & weathering
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const s = Math.random() * 2 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? '#1a1d20' : '#2b3035';
        ctx.fillRect(x, y, s, s);
      }

      // Outer solid white lane boundary lines
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(14, 0, 8, height);
      ctx.fillRect(width - 22, 0, 8, height);

      // Inner lane divider dashed white lines (Left lane & Right lane)
      ctx.fillStyle = 'rgba(245, 246, 250, 0.7)';
      const dashH = 48;
      const gapH = 32;
      for (let y = 0; y < height; y += dashH + gapH) {
        ctx.fillRect(width * 0.28 - 2, y, 4, dashH);
        ctx.fillRect(width * 0.72 - 2, y, 4, dashH);
      }

      // Center double yellow divider line (ঢাকা ট্রাফিক রোড পেইন্ট)
      ctx.fillStyle = '#fbc531';
      ctx.fillRect(width / 2 - 8, 0, 5, height);
      ctx.fillRect(width / 2 + 3, 0, 5, height);

    } else if (type === 'bridge') {
      // Arched Lake Bridge terracotta brick roadway with expansion joints
      ctx.fillStyle = '#7a3124';
      ctx.fillRect(0, 0, width, height);

      // Brick plank lines
      ctx.strokeStyle = '#532017';
      ctx.lineWidth = 3;
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // White pedestrian borders
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(10, 0, 8, height);
      ctx.fillRect(width - 18, 0, 8, height);

    } else {
      // Residential Sub-Road: Clean Dark Asphalt (#282d32)
      ctx.fillStyle = '#282d32';
      ctx.fillRect(0, 0, width, height);

      // Subtle aggregate flecks
      for (let i = 0; i < 2500; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = Math.random() > 0.5 ? '#202428' : '#32373d';
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Outer white lane borders
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(10, 0, 6, height);
      ctx.fillRect(width - 16, 0, 6, height);

      if (hasSpeedBump) {
        // Yellow/Black Speed Breaker Warning Stripes (স্পিড ব্রেকার)
        const stripeW = 28;
        ctx.fillStyle = '#fbc531';
        ctx.fillRect(20, height * 0.4, width - 40, height * 0.2);
        ctx.fillStyle = '#1e272e';
        for (let x = 20; x < width - 40; x += stripeW * 2) {
          ctx.beginPath();
          ctx.moveTo(x, height * 0.4);
          ctx.lineTo(x + stripeW, height * 0.4);
          ctx.lineTo(x, height * 0.6);
          ctx.closePath();
          ctx.fill();
        }
      } else if (hasZebra) {
        // White zebra pedestrian crossing
        ctx.fillStyle = '#f5f6fa';
        const stripeH = 34;
        const gap = 22;
        for (let y = 24; y < height - 24; y += stripeH + gap) {
          ctx.fillRect(24, y, width - 48, stripeH);
        }
      } else {
        // Center single dashed white line
        ctx.fillStyle = '#f5f6fa';
        const dashH = 46;
        const gapH = 34;
        for (let y = 0; y < height; y += dashH + gapH) {
          ctx.fillRect(width / 2 - 3, y, 6, dashH);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  // Black and white sidewalk curb texture
  public static createCurbTexture(): THREE.CanvasTexture {
    const key = 'curb_bw';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const segmentW = 64;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1e272e' : '#f5f6fa';
      ctx.fillRect(i * segmentW, 0, segmentW, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  // Bangladesh CNG Official Number Plate: ঢাকা মেট্রো - থ ১১-৮৪৫২
  public static createCNGNumberPlateTexture(plateNumber: string = 'ঢাকা মেট্রো-থ ১১-৮৪৫২'): THREE.CanvasTexture {
    const key = `plate_${plateNumber}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    // Green background
    ctx.fillStyle = '#0e6234';
    ctx.fillRect(0, 0, 256, 80);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 72);

    // Red circle motif
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(26, 40, 14, 0, Math.PI * 2);
    ctx.fill();

    // White bold Bengali text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Hind Siliguri", "Kalpurush", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateNumber, 140, 40);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  // Dashboard gauge texture for CNG
  public static createCNGDashTexture(): THREE.CanvasTexture {
    const key = 'cng_dashboard';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#3a424d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let speed = 0; speed <= 60; speed += 10) {
      const angle = (Math.PI * 0.75) + (speed / 60) * (Math.PI * 1.5);
      const x1 = 128 + Math.cos(angle) * 85;
      const y1 = 128 + Math.sin(angle) * 85;
      const x2 = 128 + Math.cos(angle) * 70;
      const y2 = 128 + Math.sin(angle) * 70;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const xt = 128 + Math.cos(angle) * 55;
      const yt = 128 + Math.sin(angle) * 55;
      ctx.fillStyle = speed > 45 ? '#e74c3c' : '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(speed.toString(), xt, yt);
    }

    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('km/h', 128, 165);
    ctx.fillStyle = '#ffd600';
    ctx.font = '12px sans-serif';
    ctx.fillText('CNG GAS', 128, 190);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  // Floral Rexine passenger seat pattern
  public static createRexineSeatTexture(): THREE.CanvasTexture {
    const key = 'rexine_seat';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#5c1d24';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#3f1217';
    ctx.lineWidth = 2;
    for (let i = -128; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i + 128, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
    }

    ctx.fillStyle = '#e67e22';
    for (let x = 16; x < 128; x += 32) {
      for (let y = 16; y < 128; y += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.cache.set(key, texture);
    return texture;
  }

  // Authentic Dhaka Shopfront Signboards matching the Illustrated Reference Map
  public static createShopSignboardTexture(
    banglaTitle: string,
    subTextBangla: string,
    englishTitle: string,
    themeColor: string,
    bgColor: string = '#ffffff'
  ): THREE.CanvasTexture {
    const key = `shop_${banglaTitle}_${themeColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 160);

    // Top banner stripe
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, 512, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Hind Siliguri", "Kalpurush", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('বিসমিল্লাহির রাহমানির রাহীম', 256, 19);

    // Main Bengali Title
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 44px "Hind Siliguri", "Kalpurush", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(banglaTitle, 256, 84);

    // Subtitle in Bengali
    ctx.fillStyle = '#2c3e50';
    ctx.font = '22px "Hind Siliguri", "Kalpurush", sans-serif';
    ctx.fillText(subTextBangla, 256, 120);

    // English subtitle
    ctx.fillStyle = '#7f8c8d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(englishTitle.toUpperCase(), 256, 144);

    // Border
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 154);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  // Pre-configured list of shopboards matching the visual reference landmarks
  public static getDhanmondiShopTextures(): THREE.CanvasTexture[] {
    return [
      this.createShopSignboardTexture('রাপা প্লাজা', 'প্রিমিয়াম শপিং মল ও ব্র্যান্ডেড শোরুম', 'Rapa Plaza - Dhanmondi 27', '#8e44ad', '#faf5ff'),
      this.createShopSignboardTexture('ইবনে সিনা হাসপাতাল', 'বিশেষায়িত চিকিৎসা কেন্দ্র ও ডায়াগনস্টিক', 'IBN Sina Specialized Hospital', '#16a085', '#f0fdf9'),
      this.createShopSignboardTexture('বাংলাদেশ আই হাসপাতাল', 'চক্ষু রোগ বিশেষজ্ঞ ও সার্জারি সেন্টার', 'Bangladesh Eye Hospital', '#2980b9', '#f0f7fc'),
      this.createShopSignboardTexture('ল্যাবএইড স্পেশালাইজড', 'কার্ডিয়াক ও জেনারেল হাসপাতাল', 'LABAID Specialized Hospital', '#c0392b', '#fff5f5'),
      this.createShopSignboardTexture('সিটি হাসপাতাল', '২৪ ঘণ্টা জরুরি বিভাগ ও আইসিইউ', 'City Hospital & Diagnostic', '#d35400', '#fff9e6'),
      this.createShopSignboardTexture('রবীন্দ্র চা কুটির', 'লেকভিউ গরম মালাই চা ও বিস্কুট', 'Rabindra Lakeview Cafe', '#b03a2e', '#fffaf0'),
      this.createShopSignboardTexture('আবাহনী স্পোর্টস ক্লাব', 'ক্রীড়া সরঞ্জাম ও ক্লাব কনফেকশনারি', 'Abahani Sports Complex', '#27ae60', '#f4faf6'),
      this.createShopSignboardTexture('ধানমন্ডি বিরিয়ানি হাউজ', 'ঐতিহ্যবাহী কাচ্চি বিরিয়ানি ও বোরহানি', 'Dhanmondi Biryani House', '#e67e22', '#fffaf5'),
      this.createShopSignboardTexture('বেঙ্গল বই ধানমন্ডি', 'বই, শিল্পকলা ও মুক্ত আড্ডা ক্যাফে', 'Bengal Boi Dhanmondi', '#34495e', '#f8fafc')
    ];
  }

  // Illustrated Dhaka Bus Painted Livery Texture
  public static createDhakaBusTexture(busName: string, routeBangla: string, mainColor: string, stripeColor: string): THREE.CanvasTexture {
    const key = `bus_${busName}_${mainColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = mainColor;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(512, 110);
    ctx.lineTo(512, 170);
    ctx.lineTo(0, 200);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 100, 512, 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(busName, 256, 75);

    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(40, 185, 432, 45);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
    ctx.fillText(routeBangla, 256, 215);

    ctx.fillStyle = 'rgba(20, 30, 40, 0.9)';
    ctx.fillRect(0, 0, 512, 45);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  // Rickshaw decorative folk art backplate
  public static createRickshawArtTexture(): THREE.CanvasTexture {
    const key = 'rickshaw_art';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(0, 0, 256, 180);

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 170);

    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(128, 90, 95, 60, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(128, 90, 75, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = 128 + Math.cos(angle) * 30;
      const py = 90 + Math.sin(angle) * 22;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(128, 90, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('মায়ের দোয়া', 128, 165);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  // Illustrated Building Facades with Cel-shaded Outlines matching Illustrated Art Style
  public static createBuildingFacadeTexture(style: 'residential_mint' | 'residential_cream' | 'commercial_blue' | 'brick'): THREE.CanvasTexture {
    const key = `facade_${style}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    let baseColor = '#e8dfd3'; // Default cream
    if (style === 'residential_mint') baseColor = '#d1f2eb';
    if (style === 'commercial_blue') baseColor = '#d6eaf8';
    if (style === 'brick') baseColor = '#e59866';

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Cel-shaded outer framing border
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 506);

    const winCols = 4;
    const winRows = 4;
    const cellW = 512 / winCols;
    const cellH = 512 / winRows;

    for (let r = 0; r < winRows; r++) {
      for (let c = 0; c < winCols; c++) {
        const x = c * cellW + 16;
        const y = r * cellH + 16;
        const w = cellW - 32;
        const h = cellH - 32;

        // Cel-shaded window frame
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x, y, w, h);

        // Glass pane
        ctx.fillStyle = '#85c1e9';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

        // Window reflection diagonal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + w * 0.45, y + 4);
        ctx.lineTo(x + 4, y + h * 0.45);
        ctx.closePath();
        ctx.fill();

        // Iron security grill lines
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 2;
        for (let gx = x + 12; gx < x + w - 12; gx += 14) {
          ctx.beginPath();
          ctx.moveTo(gx, y + 4);
          ctx.lineTo(gx, y + h - 4);
          ctx.stroke();
        }

        // Balcony ledge
        ctx.fillStyle = '#34495e';
        ctx.fillRect(x - 4, y + h - 12, w + 8, 12);

        // Occasional AC unit
        if ((r + c) % 3 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + w - 28, y + h - 6, 24, 16);
          ctx.strokeStyle = '#2c3e50';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + w - 28, y + h - 6, 24, 16);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }
}
