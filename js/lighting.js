// js/lighting.js
export function setupLighting(scene, THREE, renderer){
  const hemi = new THREE.HemisphereLight(0xbcdfff, 0x111111, 0.8);
  hemi.position.set(0, 3, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(2.5, 3.2, 1.8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 10;
  dir.shadow.camera.left = -3; dir.shadow.camera.right = 3; dir.shadow.camera.top = 3; dir.shadow.camera.bottom = -3;
  scene.add(dir);

  // helper optional:
  // scene.add(new THREE.DirectionalLightHelper(dir, 0.2));

  return { hemi, dir };
}
