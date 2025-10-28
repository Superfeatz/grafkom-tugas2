// js/utils.js
export function createScene(container, THREE, OrbitControls){
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || (window.innerHeight-54));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  const camera = new THREE.PerspectiveCamera(55, (container.clientWidth||window.innerWidth)/(container.clientHeight||window.innerHeight), 0.1, 50);
  camera.position.set(2.4, 1.6, 2.1);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.7, 0);
  controls.update();

  return { renderer, scene, camera, controls };
}
