// js/floor.js
export function createFloor(THREE, { size = 6, tileSize = 0.3, groutColor = "#bfb6ad", tileColor = "#d9cfc7" } = {}) {
  // Buat tekstur ubin lantai mirip dinding
  const canvas = document.createElement("canvas");
  const texSize = 1024;
  canvas.width = canvas.height = texSize;
  const ctx = canvas.getContext("2d");

  // Latar: nat (grout)
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, texSize, texSize);

  const tilesX = Math.ceil(size / tileSize);
  const tilesY = Math.ceil(size / tileSize);
  const tilePx = texSize / tilesX;
  const groutPx = tilePx * 0.08; // 8% lebar nat

  for (let i = 0; i < tilesX; i++) {
    for (let j = 0; j < tilesY; j++) {
      const x = i * tilePx + groutPx;
      const y = j * tilePx + groutPx;
      const w = tilePx - groutPx * 2;
      const h = tilePx - groutPx * 2;

      ctx.fillStyle = tileColor;
      ctx.fillRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(tilesX, tilesY);
  texture.anisotropy = 8;

  // Material lantai
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Geometri lantai
  const geometry = new THREE.PlaneGeometry(size, size);
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;

  return floor;
}