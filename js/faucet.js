// js/faucet.js
// Keran dinding model foto: bodi bulat, spout pendek agak melengkung, aerator, lever kecil
export function createFaucet(THREE) {
  const root = new THREE.Group(); root.name = "FaucetRoot";

  // Perak PBR (pakai scene.environment)
  const silver = new THREE.MeshStandardMaterial({
    color: 0xc6c9cf, metalness: 1.0, roughness: 0.22
  });

  // ===== Geometri utama =====
  const yAxis = 1.02;      // tinggi center keran
  const rPipe = 0.018;     // radius pipa
  const lenStub = 0.05;    // pipa dari dinding
  const ε = 0.001;

  // Flange elips menempel dinding (foto terlihat agak oval)
  const flange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.012, 48),
    silver
  );
  flange.rotation.z = Math.PI/2;
  flange.scale.y = 0.85;                      // elips vertikal
  flange.position.set(-0.006, yAxis, 0);
  flange.castShadow = flange.receiveShadow = true;
  root.add(flange);

  // Stub (pipa pendek keluar dari dinding)
  const stub = new THREE.Mesh(
    new THREE.CylinderGeometry(rPipe+0.002, rPipe+0.002, lenStub, 32),
    silver
  );
  stub.rotation.z = Math.PI/2;
  stub.position.set(lenStub/2, yAxis, 0);
  stub.castShadow = true;
  root.add(stub);

  // “Bodi bulat” (bulge) – gabungan kapsul + bola biar mirip foto
  const bulge = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.075, 12, 24), silver);
  bulge.rotation.z = Math.PI/2;
  bulge.position.set(lenStub + 0.02, yAxis+0.005, 0);
  bulge.castShadow = true;
  root.add(bulge);

  // Joint ke spout (silinder sangat pendek sebagai transisi)
  const joint = new THREE.Mesh(new THREE.CylinderGeometry(rPipe+0.004, rPipe+0.004, 0.018, 24), silver);
  joint.rotation.z = Math.PI/2;
  joint.position.set(lenStub + 0.06, yAxis-0.002, 0);
  joint.castShadow = true; root.add(joint);

  // Spout S-curve pendek (sedikit turun) — bentuk khas foto
  const path = new THREE.CurvePath();
  const x0 = lenStub + 0.069, y0 = yAxis-0.002;
  const pA = new THREE.Vector3(x0-ε, y0, 0);
  const pB = new THREE.Vector3(x0+ε, y0, 0);
  const pC = new THREE.Vector3(x0+0.03, y0-0.005, 0);
  const pD = new THREE.Vector3(x0+0.055, y0-0.035, 0);
  const pE = new THREE.Vector3(x0+0.06,  y0-0.055, 0); // ujung bawah
  path.add(new THREE.LineCurve3(pA, pB));
  path.add(new THREE.QuadraticBezierCurve3(pB, pC, pD));
  path.add(new THREE.LineCurve3(pD, pE));

  const tube = new THREE.TubeGeometry(path, 48, rPipe, 24, false);
  const spout = new THREE.Mesh(tube, silver);
  spout.castShadow = true; root.add(spout);

  // Aerator ring (seperti di foto)
  const aerator = new THREE.Mesh(
    new THREE.TorusGeometry(rPipe*0.95, rPipe*0.35, 12, 28),
    silver
  );
  aerator.rotation.x = Math.PI/2;
  aerator.position.copy(pE);
  aerator.castShadow = true; root.add(aerator);

  // Titik emisi air tepat di bawah aerator
  const spoutTip = new THREE.Object3D();
  spoutTip.position.copy(pE).add(new THREE.Vector3(0, -0.08, 0));
  root.add(spoutTip);

  // ===== Lever kecil di atas (0→90° ke kanan tetap; bisa diubah ke naik-turun) =====
  const handlePivot = new THREE.Group();
  handlePivot.position.set(lenStub + 0.03, yAxis+0.045, 0);
  root.add(handlePivot);

  // lever tipis dengan lubang (pakai box + silinder kecil sebagai “hole” semu)
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.02), silver);
  lever.position.x = 0.04;
  lever.castShadow = true; handlePivot.add(lever);

  // knob kecil di pangkal lever
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), silver);
  knob.position.set(0, -0.006, 0);
  handlePivot.add(knob);

  return { root, handlePivot, handle: lever, spoutTip };
}
