/* =========================================================
   SIX — le n°6 du joueur, extrudé, sous projecteurs.
   - chargé seulement quand la section approche (IntersectionObserver)
   - devicePixelRatio limité, rendu STOPPÉ hors écran
   - rotation : idle lente + poussée du curseur (drag) + scrub au scroll
   - WebGL absent, erreur, ou prefers-reduced-motion → version statique SVG
   ========================================================= */
"use strict";

(() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const holder = document.querySelector(".six");
  if (!holder) return;

  const enableFallback = () => holder.classList.add("no-webgl");
  if (REDUCED || typeof IntersectionObserver === "undefined") { enableFallback(); return; }

  const loader = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) {
      loader.disconnect();
      init().catch(() => { console.warn("six: fallback statique", []); enableFallback(); });
    }
  }, { rootMargin: "260px" });
  loader.observe(holder);

  async function init() {
    const canvas = holder.querySelector(".six-canvas");
    if (!canvas || !("WebGLRenderingContext" in window)) throw new Error("no webgl");

    const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.js");

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, .1, 60);
    cam.position.set(0, 0, 8.2);

    /* --- le 6 : bol annulaire + croissant, style affichage --- */
    const bowl = new THREE.Shape();
    bowl.absarc(0, -0.62, 1, 0, Math.PI * 2);
    const hole = new THREE.Path();
    hole.absarc(0, -0.62, 0.46, 0, Math.PI * 2, true);
    bowl.holes.push(hole);

    /* croissant : anneau partiel autour d'un centre plus haut */
    const tail = new THREE.Shape();
    const cx = -0.10, cy = 1.30, rO = 1.30, rI = 0.92, a0 = -0.24, a1 = 1.02;
    tail.absarc(cx, cy, rO, a0, a1, false);
    tail.absarc(cx, cy, rI, a1, a0, true);
    tail.closePath();

    const opts = {
      depth: .58, bevelEnabled: true, bevelThickness: .07,
      bevelSize: .05, bevelSegments: 2, curveSegments: 40
    };
    const mat = new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: .38, metalness: .12 });

    const six = new THREE.Group();
    six.add(new THREE.Mesh(new THREE.ExtrudeGeometry(bowl, opts), mat));
    six.add(new THREE.Mesh(new THREE.ExtrudeGeometry(tail, opts), mat));
    six.position.set(0, -0.72, 0);   // la géométrie s'étend de -1.6 à +2.6 : on recentre
    six.rotation.x = .10;
    scene.add(six);

    /* --- projecteurs de stade --- */
    const spot = (x, y, z, i, ang) => {
      const s = new THREE.SpotLight(0xffffff, i, 45, ang, .55, 1.7);
      s.position.set(x, y, z);
      scene.add(s, s.target);
      s.target.position.set(0, 0, 0);
      return s;
    };
    spot(-3.6, 6.5, 4.2, 900, .5);   // éclairage principal, face droite
    spot(4.6, 3.4, -3.2, 380, .62);  // contralight de dosage, dos gauche
    scene.add(new THREE.AmbientLight(0xffffff, .14));

    /* --- taille --- */
    const size = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cam.aspect = r.width / r.height;
      renderer.setSize(r.width, r.height, false);
      cam.updateProjectionMatrix();
    };
    size();
    addEventListener("resize", size);

    /* --- interactif : le recruteur pousse le numéro --- */
    let ry = 0, rx = 0, vy = 0, vx = 0, dragging = false;
    holder.addEventListener("pointerdown", e => { dragging = true; holder.setPointerCapture?.(e.pointerId); });
    addEventListener("pointerup", () => { dragging = false; });
    holder.addEventListener("pointermove", e => {
      if (!dragging) return;
      vy += (e.movementX || 0) * .0038;   // glisser horizontalement → tourne
      vx += (e.movementY || 0) * .0026;
    });

    /* scrub discret au scroll : le numéro répond au cheminement */
    let lastY = scrollY;
    addEventListener("scroll", () => {
      vy += Math.max(-.02, Math.min(.02, (scrollY - lastY) * .00025));
      lastY = scrollY;
    }, { passive: true });

    /* --- rendu à la demande : stop net hors écran --- */
    let visible = true, raf = 0;
    const watcher = new IntersectionObserver(es => {
      const was = visible;
      visible = es[0].isIntersecting;
      if (visible && !was) { raf = requestAnimationFrame(frame); }
    }, { threshold: 0 });
    watcher.observe(holder);

    function frame(now) {
      if (!visible) { raf = 0; return; }
      ry += vy + .0018;                    // idle très lent + impulsion
      rx += vx; vx *= .93; vy *= .93;
      six.rotation.y = ry;
      six.rotation.x = .10 + Math.max(-.5, Math.min(.5, rx));
      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
})();
