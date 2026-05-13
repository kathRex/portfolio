// Spawn soap-bubble images when the user scrolls downward.

(function () {
  const BUBBLE_SRC = '/artsyFartsy/artsyAssets/bubble.png';
  let lastY = window.scrollY;
  let lastSpawn = 0;
  const MIN_COOLDOWN = 350; // ms between spawn events
  const MIN_BUBBLE = 50; // px
  const MAX_BUBBLE = 170; // px

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }
  function randFloat(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnBubbles() {
    const count = randInt(2, 6);
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    for (let i = 0; i < count; i++) {
      const size = randInt(MIN_BUBBLE, MAX_BUBBLE);
      const el = document.createElement('div');
      el.className = 'bubble';
      el.style.width = size + 'px';
      // random horizontal position but keep fully inside viewport
      const left = randInt(8, Math.max(8, vw - size - 8));
      el.style.left = left + 'px';
      // random animation duration and horizontal drift
      const dur = randInt(3200, 7200);
      const drift = `${randInt(-90, 90)}px`;
      const scale = (size / MAX_BUBBLE) * randFloat(0.9, 1.15);

      el.style.setProperty('--duration', dur + 'ms');
      el.style.setProperty('--drift', drift);
      el.style.setProperty('--scale', scale);

      // Use an <img> inside to keep proper aspect and allow future tinting
      const img = document.createElement('img');
      img.src = BUBBLE_SRC;
      img.alt = 'bubble';
      el.appendChild(img);

      // remove after animation finishes
      const removeAfter = dur + 200;
      const cleanup = () => {
        if (el.parentNode) el.parentNode.removeChild(el);
        el.removeEventListener('animationend', onAnimEnd);
        clearTimeout(timeoutId);
      };
      const onAnimEnd = cleanup;
      el.addEventListener('animationend', onAnimEnd);
      const timeoutId = setTimeout(cleanup, removeAfter);

      document.body.appendChild(el);
    }
  }

  window.addEventListener('scroll', function () {
    const y = window.scrollY || window.pageYOffset;
    const now = Date.now();
    const scrollingDown = y > lastY;
    lastY = y;
    if (!scrollingDown) return;
    if (now - lastSpawn < MIN_COOLDOWN) return;
    lastSpawn = now;
    spawnBubbles();
  }, { passive: true });
})();