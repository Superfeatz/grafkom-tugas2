// js/autoAnimation.js
export function setupAutoAnimation(THREE, faucet, water, onComplete = null) {
  let phase = 'fill';     // 'fill' | 'overflow' | 'reset'
  let timer = 0;
  const fillDuration = 12;    // detik sampai penuh
  const overflowDuration = 4; // detik tumpah
  const resetDuration = 2;    // detik reset

  function update(dt) {
    timer += dt;

    if (phase === 'fill') {
      // Buka keran perlahan
      const progress = Math.min(timer / fillDuration, 1);
      const angle = progress * (Math.PI / 2);
      faucet.handlePivot.rotation.y = angle;

      // Debit maksimal
      water.setRate(1800);

      // Cek ember penuh
      if (water.bucketFill >= water.bucketMaxFill * 0.98) {
        phase = 'overflow';
        timer = 0;
      }
    }
    else if (phase === 'overflow') {
      // Keran tetap terbuka
      faucet.handlePivot.rotation.y = Math.PI / 2;
      water.setRate(1800);

      if (timer > overflowDuration) {
        phase = 'reset';
        timer = 0;
      }
    }
    else if (phase === 'reset') {
      // Tutup keran
      const progress = timer / resetDuration;
      const angle = (1 - progress) * (Math.PI / 2);
      faucet.handlePivot.rotation.y = angle;

      // Hentikan air
      water.setRate(0);

      // Kosongkan ember & genangan
      if (progress > 0.3) {
        water.bucketFill = 0;
        if (water.surface) {
          water.surface.position.y = -water.bucketH / 2;
        }
        if (water.puddle) {
          water.puddle.scale.setScalar(0.001);
          water.puddle.material.opacity = 0;
        }
      }

      if (timer > resetDuration) {
        phase = 'fill';
        timer = 0;
        if (onComplete) onComplete();
      }
    }
    // Di autoAnimation.js → tambahkan di update()
    const statusEl = document.getElementById("status");
        if (statusEl) {
        if (phase === 'fill') statusEl.textContent = `Mengisi... ${Math.round(timer)}s`;
        if (phase === 'overflow') statusEl.textContent = `Meluap...`;
        if (phase === 'reset') statusEl.textContent = `Reset...`;
    }
  }

  return { update };
}