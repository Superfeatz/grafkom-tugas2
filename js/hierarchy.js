// js/hierarchy.js
export function setupHierarchy(THREE, faucet, water, dom, guiContainer){
  // sudut tuas (rad) 0..PI/2 , 0 = tertutup, PI/2 = terbuka penuh (tuas geser ke kanan)
  let angle = 0;

  // drag horizontal untuk ubah sudut
  let dragging = false, lastX = 0;
  function onDown(e){ dragging = true; lastX = ("touches" in e)? e.touches[0].clientX : e.clientX; }
  function onMove(e){
    if(!dragging) return;
    const x = ("touches" in e)? e.touches[0].clientX : e.clientX;
    const dx = (x - lastX) / 250; // sensitivitas
    lastX = x;
    angle = clamp(angle + dx, 0, Math.PI/2);
    apply();
  }
  function onUp(){ dragging = false; }
  dom.addEventListener("mousedown", onDown); dom.addEventListener("touchstart", onDown, {passive:true});
  window.addEventListener("mousemove", onMove); window.addEventListener("touchmove", onMove, {passive:true});
  window.addEventListener("mouseup", onUp); window.addEventListener("touchend", onUp);

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function apply(){
    // Putar tuas pada sumbu Y (ke kanan = +Y)
    faucet.handlePivot.rotation.y = angle;

    // Map sudut → valve 0..1
    const valve = angle / (Math.PI/2);
    // Atur laju emisi & kecepatan awal
    water.setRate(1800 * valve);           // 0..1800 partikel/detik
    water.initialSpeed = 2.6 * valve + 0.1;
  }

  // GUI kecil (slider 0..90°)
  const wrap = document.createElement("div");
  wrap.style.cssText = "background:rgba(0,0,0,.5);padding:8px 10px;border:1px solid #333;border-radius:8px;backdrop-filter:blur(6px)";
  wrap.innerHTML = `
    <div style="font-size:12px;margin-bottom:6px">Sudut Tuas: <span id="angLbl">0</span>°</div>
    <input id="angSlider" type="range" min="0" max="90" step="1" value="0" style="width:160px">
  `;
  guiContainer.appendChild(wrap);
  const angLbl = wrap.querySelector("#angLbl");
  const slider = wrap.querySelector("#angSlider");
  slider.addEventListener("input", e => { angle = parseFloat(e.target.value) * Math.PI/180; apply(); });
  function update(){ angLbl.textContent = Math.round(angle*180/Math.PI); }

  apply();
  return { update };
}
