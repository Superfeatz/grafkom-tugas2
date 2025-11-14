// js/water.js
// Emitter partikel air + logika ember (fill + overflow) + lantai (slide + puddle)
export class WaterEmitter {
  constructor(
    THREE,
    {
      scene,
      count = 3000,
      originObject,                          // Object3D sumber air
      gravity = new THREE.Vector3(0, -9.8, 0),
      bucket = null,                          // { object: THREE.Object3D, radius: number, height: number }
      floorY = 0,                             // tinggi lantai
      shadow = false
    }
  ) {
    this.THREE = THREE;
    this.scene = scene;
    this.originObject = originObject;
    this.g = gravity.clone ? gravity.clone() : new THREE.Vector3(0, -9.8, 0);

    // ---------- Konfigurasi ember (opsional)
    this.bucketObj = bucket?.object || null;
    this.bucketR   = bucket?.radius ?? 0.25;
    this.bucketH   = bucket?.height ?? 0.30;
    this.bucketFill = 0;                      // tinggi air (m), dari dasar ember
    this.bucketMaxFill = this.bucketH;        // 100% (tepat bibir)
    this.waterPerParticle = 0.0002;         // volume per partikel (m^3) → atur kecepatan penuh

    // ---------- Particles pool
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const ages       = new Float32Array(count);
    const life       = new Float32Array(count);
    this.pool = { positions, velocities, ages, life, max: count };
    this.cursor = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.025,
        map: new THREE.TextureLoader().load("../clear_droplet.png"),
        color: 0x88ccff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      })
    );
    this.points.frustumCulled = false;
    this.points.castShadow = !!shadow;
    scene.add(this.points);

    // ---------- Permukaan air di ember
    if (this.bucketObj) {
      const diskR = Math.max(0.001, this.bucketR - 0.01);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        roughness: 0.02,
        metalness: 0.0,
        transmission: 0.96,
        thickness: 0.25,
        ior: 1.33,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.surface = new THREE.Mesh(new THREE.CircleGeometry(diskR, 48), mat);
      this.surface.rotation.x = -Math.PI / 2;
      this.surface.position.y = -this.bucketH / 2 + 0.003; // mulai dari dasar
      this.surface.receiveShadow = true;
      this.bucketObj.add(this.surface);
    } else {
      this.surface = null;
    }

    // ---------- Emission config
    this.rate = 0;                 // partikel/detik (diset dari luar)
    this.initialSpeed = 2.4;
    this.accum = 0;

    // ---------- Lantai & genangan
    this.floorY = floorY;
    this.slideFriction = 0.85;
    this.floorBounce   = 0.05;

    this.puddle = null;
    if (Number.isFinite(this.floorY)) {
      const puddleGeo = new THREE.CircleGeometry(0.01, 32);
      const puddleMat = new THREE.MeshPhysicalMaterial({
        color: 0x2266cc,
        roughness: 0.1,
        transmission: 0.7,
        transparent: true,
        opacity: 0.6
      });
      this.puddle = new THREE.Mesh(puddleGeo, puddleMat);
      this.puddle.rotation.x = -Math.PI / 2;
      this.puddle.position.y = this.floorY + 0.0005; // sedikit di atas lantai
      this.puddle.scale.setScalar(0.001); // mulai kecil sekali
      this.scene.add(this.puddle);
    }

    // ---------- Overflow akumulator
    this.overflowAccum = 0;
  }

  // API eksternal
  setRate(particlesPerSecond) { this.rate = particlesPerSecond; }

  // Emit 1 partikel dari ujung keran
  emitOne() {
    const i = this.cursor % this.pool.max;
    this.cursor++;

    const o = new this.THREE.Vector3();
    this.originObject.getWorldPosition(o);

    const dir = new this.THREE.Vector3(
      (Math.random() - 0.5) * 0.06,
      -1,
      (Math.random() - 0.5) * 0.06
    ).normalize();

    const s = this.initialSpeed * (0.85 + Math.random() * 0.3);

    this.pool.positions[i*3+0] = o.x;
    this.pool.positions[i*3+1] = o.y;
    this.pool.positions[i*3+2] = o.z;

    this.pool.velocities[i*3+0] = dir.x * s;
    this.pool.velocities[i*3+1] = dir.y * s;
    this.pool.velocities[i*3+2] = dir.z * s;

    this.pool.ages[i] = 0;
    this.pool.life[i] = 20.0;
  }

  // Naikkan permukaan air (dan trigger overflow)
  _accumulateBucket() {
    if (!this.bucketObj) return;

    const area = Math.PI * this.bucketR * this.bucketR;
    const dh = this.waterPerParticle / area;

    const prev = this.bucketFill;
    this.bucketFill = Math.min(this.bucketFill + dh, this.bucketMaxFill);

    if (this.surface) {
      this.surface.position.y = -this.bucketH / 2 + this.bucketFill;
      this.surface.scale.setScalar(1); // radius konstan
    }

    // trigger overflow pada saat penuh pertama kali
    if (prev < this.bucketMaxFill && this.bucketFill >= this.bucketMaxFill) {
      this._spawnOverflowParticles(8 + Math.floor(Math.random() * 8));
    } else if (this.bucketFill >= this.bucketMaxFill) {
      // selama penuh, tumpahkan proporsional dengan inflow
      this.overflowAccum += dh;
      const one = this.waterPerParticle;
      const spillCount = Math.floor(this.overflowAccum / one);
      if (spillCount > 0) {
        this._spawnOverflowParticles(Math.min(spillCount, 15));
        this.overflowAccum -= spillCount * one;
      }
    }
  }

  // Munculkan partikel tumpahan dari bibir ember dan besarkan genangan
  _spawnOverflowParticles(count) {
    if (!this.bucketObj) return;

    const world = new this.THREE.Vector3();
    this.bucketObj.getWorldPosition(world);

    for (let k = 0; k < count; k++) {
      this.emitOne();
      const i = (this.cursor - 1) % this.pool.max;
      const pos = this.pool.positions;
      const vel = this.pool.velocities;

      const ang = Math.random() * Math.PI * 2;
      const r   = this.bucketR * 0.96;
      const y   = world.y + this.bucketH / 2;

      pos[i*3+0] = world.x + r * Math.cos(ang);
      pos[i*3+1] = y;
      pos[i*3+2] = world.z + r * Math.sin(ang);

      const out = new this.THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const speed = 0.4 + Math.random() * 0.6;
      const down  = 0.8 + Math.random() * 0.4;

      vel[i*3+0] = out.x * speed * 0.7 + (Math.random() - 0.5) * 0.3;
      vel[i*3+1] = -down;
      vel[i*3+2] = out.z * speed * 0.7 + (Math.random() - 0.5) * 0.3;

      this.pool.life[i] = 0.8 + Math.random() * 0.6;
    }

    // genangan membesar
    this._growPuddle(0.002);
  }

  _growPuddle(delta) {
    if (!this.puddle) return;
    const s = Math.min(0.4, this.puddle.scale.x + delta);
    this.puddle.scale.setScalar(s);
    this.puddle.material.opacity = 0.6 + s * 0.5;
  }

  update(dt) {
    // emisi akumulatif
    this.accum += dt * this.rate;
    const n = Math.floor(this.accum);
    this.accum -= n;
    for (let k = 0; k < n; k++) this.emitOne();

    const pos = this.pool.positions;
    const vel = this.pool.velocities;
    const age = this.pool.ages;
    const life = this.pool.life;

    // world center ember
    let bcx = 0, bcy = 0, bcz = 0;
    if (this.bucketObj) {
      const w = new this.THREE.Vector3();
      this.bucketObj.getWorldPosition(w);
      bcx = w.x; bcy = w.y; bcz = w.z;
    }

    for (let i = 0; i < life.length; i++) {
      if (life[i] <= 0) continue;

      // integrasi
      age[i] += dt; if (age[i] >= life[i]) { life[i] = 0; continue; }

      vel[i*3+0] += this.g.x * dt;
      vel[i*3+1] += this.g.y * dt;
      vel[i*3+2] += this.g.z * dt;

      pos[i*3+0] += vel[i*3+0] * dt;
      pos[i*3+1] += vel[i*3+1] * dt;
      pos[i*3+2] += vel[i*3+2] * dt;

      // --- Bucket collision
      if (this.bucketObj) {
        const rx = pos[i*3+0] - bcx;
        const ry = pos[i*3+1] - bcy;
        const rz = pos[i*3+2] - bcz;

        const inR = (rx*rx + rz*rz) < (this.bucketR * this.bucketR * 0.98);
        const inY = (ry > -this.bucketH/2) && (ry < this.bucketH/2);

        if (inR && inY) {
          const surfaceY = -this.bucketH/2 + this.bucketFill + 0.002;
          if (ry <= surfaceY || this.bucketFill <= 0.001) {
            life[i] = 0;                 // diserap air
            this._accumulateBucket();    // naikkan level / overflow
            continue;
          } else {
            // sentuh permukaan → splash kecil
            vel[i*3+0] *= 0.30;
            vel[i*3+1] *= -0.10;
            vel[i*3+2] *= 0.30;
            life[i] = Math.min(life[i], age[i] + 0.30);
          }
        }
      }

      // --- Floor interaction
      if (pos[i*3+1] <= this.floorY + 0.001) {
        pos[i*3+1] = this.floorY + 0.001;
        vel[i*3+1] = Math.abs(vel[i*3+1]) * this.floorBounce;

        if (Math.random() < 0.7) {
          vel[i*3+0] += (Math.random() - 0.5) * 0.6;
          vel[i*3+2] += (Math.random() - 0.5) * 0.6;
        }
        vel[i*3+0] *= this.slideFriction;
        vel[i*3+2] *= this.slideFriction;

        if (age[i] > 0.8) life[i] = Math.min(life[i], age[i] + 0.15);

        this._growPuddle(0.0006);  // tiap tetes yang menyentuh lantai → genangan membesar
      }
    }

    // Overflow kontinu (tambahan safety, bila inflow besar)
    if (this.bucketObj && this.bucketFill >= this.bucketMaxFill) {
      const spillRate = this.rate * 0.6;             // proporsi inflow yang ditumpahkan
      this.overflowAccum += spillRate * dt;
      const spillN = Math.floor(this.overflowAccum);
      this.overflowAccum -= spillN;
      if (spillN > 0) this._spawnOverflowParticles(spillN);
    }

    // sinkron ke GPU
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
