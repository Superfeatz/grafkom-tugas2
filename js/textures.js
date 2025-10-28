// js/textures.js

// 1) Texture preset (matcap metal, plastic checker, sprite air)
export async function loadTextures(THREE){
  const loader = new THREE.TextureLoader();

  // Matcap metal (boleh dipakai untuk efek “chrome” ringan)
  const matcap = loader.load(
    "https://cdn.jsdelivr.net/gh/emmelleppi/matcaps/1024/3F3F3F_BFBFBF_9F9F9F_7F7F7F.png"
  );

  // Tekstur dummy untuk ember / debug UV
  const plasticDiffuse = loader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/uv_grid_opengl.jpg"
  );

  // Sprite partikel air
  const waterSprite = loader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/water.png"
  );
  waterSprite.wrapS = waterSprite.wrapT = THREE.ClampToEdgeWrapping;
  waterSprite.flipY = false;

  return { matcap, plasticDiffuse, waterSprite };
}

// 2) Generator tekstur dinding ubin (kanvas → CanvasTexture)
export function makeTiledWallTexture(
  THREE,
  {
    tileW = 0.15, tileH = 0.30,   // hanya untuk referensi proporsi (tak dipakai langsung)
    gap   = 0.006,                // lebar nat (proporsional)
    rows  = 12,
    cols  = 10,
    grout = "#bfb6ad",            // warna nat
    tile  = "#d9cfc7"             // warna ubin
  } = {}
){
  const pxW = 1024, pxH = 1024;
  const cvs = document.createElement("canvas"); 
  cvs.width = pxW; cvs.height = pxH;
  const ctx = cvs.getContext("2d");

  // Nat sebagai latar
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, pxW, pxH);

  // Ukuran grid dalam piksel
  const sw = pxW / cols;
  const sh = pxH / rows;

  // Skala gap (proporsional ke kanvas)
  const gx = gap * pxW * 0.02;
  const gy = gap * pxH * 0.02;

  for (let r = 0; r < rows; r++){
    // Pola running bond: baris ganjil digeser setengah ubin
    const off = (r % 2 === 0) ? 0 : 0.5;
    for (let c = 0; c < cols; c++){
      const x = ((c + off) % cols) * sw + gx;
      const y = r * sh + gy;
      ctx.fillStyle = tile;
      ctx.fillRect(x, y, sw - gx * 1.5, sh - gy * 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
