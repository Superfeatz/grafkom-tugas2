// js/bucket.js
export function createBucket(THREE) {
  const root = new THREE.Group();
  root.name = "BucketTolenan";

  // Dimensi
  const height = 0.42;
  const topOuterR = 0.26;
  const bottomOuterR = 0.20;
  const wall = 0.008;
  const rimThick = 0.022;

  const innerTopR = topOuterR - wall - rimThick * 0.35;
  const innerBottomR = bottomOuterR - wall;

  // Material
  const plasticOuter = new THREE.MeshPhysicalMaterial({
    color: 0x2e66cc, roughness: 0.35, metalness: 0.0,
    clearcoat: 0.35, clearcoatRoughness: 0.5, envMapIntensity: 1.1
  });
  const plasticInner = new THREE.MeshPhysicalMaterial({
    color: 0x0f4aa8, roughness: 0.55, metalness: 0.0,
    side: THREE.DoubleSide, envMapIntensity: 1.0
  });

  // Dinding luar
  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(topOuterR, bottomOuterR, height, 64, 1, true),
    plasticOuter
  );
  outer.castShadow = true; outer.receiveShadow = true;
  root.add(outer);

  // Dinding dalam (sedikit offset anti z-fighting)
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(innerTopR, innerBottomR, height, 64, 1, true),
    plasticInner
  );
  inner.position.y = 0.0005;
  inner.receiveShadow = true;
  root.add(inner);

  // Dasar dalam — fit rapat
  const EPS = 0.0004;
  const bottomInner = new THREE.Mesh(
    new THREE.CircleGeometry(innerBottomR + EPS, 64),
    plasticInner
  );
  bottomInner.rotation.x = -Math.PI / 2;
  bottomInner.position.y = -height / 2 + EPS;
  bottomInner.receiveShadow = true;
  root.add(bottomInner);

  // Rim tebal
  const rimR = topOuterR - rimThick * 0.25;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(rimR, rimThick, 20, 96),
    plasticOuter
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = height / 2 - rimThick * 0.25;
  rim.castShadow = true;
  root.add(rim);

  // Inner lip pada sisi dalam rim
  const innerLip = new THREE.Mesh(
    new THREE.TorusGeometry(innerTopR, rimThick * 0.22, 18, 72),
    plasticInner
  );
  innerLip.rotation.x = Math.PI / 2;
  innerLip.position.y = rim.position.y - rimThick * 0.12;
  innerLip.castShadow = true;
  root.add(innerLip);

  // Data untuk WaterEmitter (pakai radius dalam yang aman)
  const center = new THREE.Vector3(0, 0, 0);
  const innerRadius = Math.min(innerTopR, innerBottomR);

  return { root, innerRadius, height, center };
}
