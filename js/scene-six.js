/* =========================================================
   SIX — le n°6 du joueur, dans le glyphe Archivo du site.
   - chargé seulement quand la section approche (IntersectionObserver)
   - devicePixelRatio limité, rendu STOPPÉ hors écran
   - rotation : respiration lente + poussée du curseur (drag) + scrub au scroll
   - WebGL absent, erreur, ou prefers-reduced-motion → version statique SVG
   ========================================================= */
"use strict";

(() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const holder = document.querySelector(".six");
  if (!holder) return;

  const enableFallback = () => {
    holder.classList.remove("has-webgl");
    holder.classList.add("no-webgl");
  };
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

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 60);
    cam.position.set(0, 0, 9.3);

    /* --- le 6 : contour exact du glyphe Archivo, extrudé --- */
    const GLYPH = [[["M",0.0225,-2.0],["Q",-0.4944,-2.0,-0.8848,-1.8848],["Q",-1.2753,-1.7697,-1.5393,-1.5365],["Q",-1.8034,-1.3034,-1.9382,-0.9438],["Q",-2.073,-0.5843,-2.073,-0.0955],["Q",-2.073,0.4663,-1.9382,0.8652],["Q",-1.8034,1.264,-1.5393,1.514],["Q",-1.2753,1.764,-0.8848,1.882],["Q",-0.4944,2.0,0.0225,2.0],["Q",0.5955,2.0,1.0281,1.8511],["Q",1.4607,1.7022,1.7051,1.4129],["Q",1.9494,1.1236,1.9494,0.6966],["L",0.7247,0.6966],["Q",0.7247,0.8708,0.6376,0.986],["Q",0.5506,1.1011,0.3961,1.1573],["Q",0.2416,1.2135,0.0393,1.2135],["Q",-0.2809,1.2135,-0.4522,1.1039],["Q",-0.6236,0.9944,-0.6882,0.7809],["Q",-0.7528,0.5674,-0.7528,0.2416],["Q",-0.5899,0.3539,-0.3961,0.4185],["Q",-0.2022,0.4831,-0.0028,0.5084],["Q",0.1966,0.5337,0.3596,0.5337],["Q",0.8371,0.5337,1.2247,0.3989],["Q",1.6124,0.264,1.8427,0.0],["Q",2.073,-0.264,2.073,-0.6517],["Q",2.073,-1.0843,1.8202,-1.3848],["Q",1.5674,-1.6854,1.1067,-1.8427],["Q",0.6461,-2.0,0.0225,-2.0],["Z"]],[["M",0.0112,-1.2079],["Q",0.2472,-1.2079,0.4185,-1.1489],["Q",0.5899,-1.0899,0.6826,-0.9747],["Q",0.7753,-0.8596,0.7753,-0.691],["Q",0.7753,-0.5169,0.6826,-0.4045],["Q",0.5899,-0.2921,0.4185,-0.2331],["Q",0.2472,-0.1742,0.0112,-0.1742],["Q",-0.2191,-0.1742,-0.3904,-0.2331],["Q",-0.5618,-0.2921,-0.6545,-0.4045],["Q",-0.7472,-0.5169,-0.7472,-0.691],["Q",-0.7472,-0.8596,-0.6545,-0.9747],["Q",-0.5618,-1.0899,-0.3904,-1.1489],["Q",-0.2191,-1.2079,0.0112,-1.2079],["Z"]]];

    const shape = new THREE.Shape();
    const hole = new THREE.Path();
    const applyPath = (commands, target) => {
      for (const c of commands) {
        if (c[0] === "M") target.moveTo(c[1], c[2]);
        else if (c[0] === "L") target.lineTo(c[1], c[2]);
        else if (c[0] === "Q") target.quadraticCurveTo(c[1], c[2], c[3], c[4]);
        else if (c[0] === "C") target.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
        else if (c[0] === "Z") target.closePath();
      }
    };
    applyPath(GLYPH[0], shape);
    applyPath(GLYPH[1], hole);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: .64,
      bevelEnabled: true,
      bevelThickness: .075,
      bevelSize: .07,
      bevelSegments: 5,
      curveSegments: 14
    });
    geo.center();

    /* face claire, tranche plus sombre : le volume se lit */
    const faceMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6e2dc, roughness: .34, metalness: .03,
      clearcoat: .6, clearcoatRoughness: .3
    });
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0x8b877f, roughness: .32, metalness: .22
    });

    const model = new THREE.Group();
    model.add(new THREE.Mesh(geo, [faceMat, sideMat]));
    const modelBox = new THREE.Box3().setFromObject(model);
    const modelSize = modelBox.getSize(new THREE.Vector3());

    const six = new THREE.Group();
    six.add(model);
    six.rotation.x = .06;
    scene.add(six);

    /* --- projecteurs de stade --- */
    const spot = (x, y, z, i, ang) => {
      const s = new THREE.SpotLight(0xffffff, i, 45, ang, .55, 1.65);
      s.position.set(x, y, z);
      scene.add(s, s.target);
      s.target.position.set(0, 0, 0);
      return s;
    };
    spot(-3.8, 6.8, 4.4, 780, .5);
    spot(4.6, 3.4, -3.2, 340, .62);
    const fill = new THREE.PointLight(0xffffff, 24, 18, 2);
    fill.position.set(0, .4, 5.2);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, .1));

    /* --- taille : le 6 reste entier, même sur mobile --- */
    const size = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cam.aspect = r.width / r.height;
      renderer.setSize(r.width, r.height, false);
      cam.updateProjectionMatrix();
      const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
      const viewW = viewH * cam.aspect;
      const fit = Math.min(1, (viewW * .88) / modelSize.x, (viewH * .84) / modelSize.y);
      six.scale.setScalar(fit);
    };
    size();
    addEventListener("resize", size);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(size).observe(canvas);
    canvas.addEventListener("webglcontextlost", e => {
      e.preventDefault();
      enableFallback();
    });

    /* --- interactif : le recruteur fait respirer le numéro --- */
    let ry = 0, rx = 0, vy = 0, vx = 0, dragging = false;
    holder.addEventListener("pointerdown", e => { dragging = true; holder.setPointerCapture?.(e.pointerId); });
    addEventListener("pointerup", () => { dragging = false; });
    holder.addEventListener("pointermove", e => {
      if (!dragging) return;
      vy += (e.movementX || 0) * .0042;
      vx += (e.movementY || 0) * .0030;
    });

    let lastY = scrollY;
    addEventListener("scroll", () => {
      vy += Math.max(-.02, Math.min(.02, (scrollY - lastY) * .00028));
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

    let revealed = false;
    function frame(now) {
      if (!visible) { raf = 0; return; }
      ry = Math.max(-.85, Math.min(.85, ry + vy));
      vx *= .93; vy *= .93;
      rx = Math.max(-.42, Math.min(.42, rx + vx));
      six.rotation.y = Math.sin(now * .00028) * .34 + ry;
      six.rotation.x = .06 + Math.sin(now * .0002) * .025 + rx;
      six.rotation.z = Math.sin(now * .00032) * .012;
      six.position.y = Math.sin(now * .00048) * .045;
      renderer.render(scene, cam);
      if (!revealed) {
        revealed = true;
        holder.classList.add("has-webgl");
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
})();
