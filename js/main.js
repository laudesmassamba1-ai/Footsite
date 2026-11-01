/* =========================================================
   ETERLING68 — main.js
   1) Données depuis data/player.json (rien d'inventé)
   2) Préchargeur pile ou face → coup d'envoi
   3) Motion : Lenis + GSAP/ScrollTrigger si dispo (dégradation
      propre sinon), vidéos en lecture paresseuse
   4) Bilingue FR/EN
   ========================================================= */

"use strict";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------
   i18n
--------------------------------------------------------- */
const I18N = {
  fr: {
    nav_action: "L'action", nav_profil: "Profil", nav_parcours: "Parcours", nav_contact: "Contact",
    toss_kicker: "Eterling68 — Nkenzo Sterling",
    toss_btn: "Pile ou face — coup d'envoi", toss_hint: "ou appuie sur entrée",
    hero_kicker: "Né en 2007 — Congo",
    hero_tag: "Le foot d'abord. La terre sous les crampons.",
    hero_meta_poste: "Poste — [À COMPLÉTER]",
    hero_scroll: "descendre",
    action_title: "La pellicule",
    action_sub: "ce que le terrain montre — rien d'autre",
    action_note: "Pris à la main, sur terrain de terre. Pas de photo officielle — encore.",
    card_tag: "CARTE DE JOUEUR — B.N.",
    card_note: "La carte n'est pas remplie. Elle attend son club.",
    season_head: "SAISON",
    parcours_title: "Le terrain",
    parcours_sub: "chaque ligne a été courue avant d'être tracée",
    parcours_note: "Certaines cases sont vides. Ce n'est pas un manque : c'est une place pour écrire.",
    contact_pre: "Feuille de match",
    contact_l1: "Prochaine", contact_l2: "composition",
    contact_tell: "La case n°11 est libre. Recruteurs, agents, clubs : c'est écrit noir sur blanc.",
    cta_whatsapp: "ÉCRIRE SUR WHATSAPP", cta_mail: "ENVOYER UN MAIL",
    sheet_agent: "Agent / manager", sheet_wa: "WhatsApp", sheet_mail: "E-mail",
    sticky_cta: "CONTACT",
    foot_rights: "tous droits réservés",
    foot_note: "Site en noir et blanc. Le club viendra apporter la couleur.",
    stat_labels: { born: "Né", position: "Poste", foot: "Pied fort", height: "Taille", club: "Club" },
    season_labels: { matchs: "Matchs", buts: "Buts", passes: "Passes D." }
  },
  en: {
    nav_action: "Action", nav_profil: "Profile", nav_parcours: "The road", nav_contact: "Contact",
    toss_kicker: "Eterling68 — Nkenzo Sterling",
    toss_btn: "Coin toss — kick-off", toss_hint: "or press enter",
    hero_kicker: "Born 2007 — Congo",
    hero_tag: "Ball first. Dirt under the boots.",
    hero_meta_poste: "Position — [TO FILL]",
    hero_scroll: "scroll down",
    action_title: "The contact sheet",
    action_sub: "what the pitch shows — nothing else",
    action_note: "Shot by hand, on a dirt pitch. No official photo — yet.",
    card_tag: "PLAYER CARD — B&W",
    card_note: "The card isn't filled in. It's waiting for its club.",
    season_head: "SEASON",
    parcours_title: "The pitch",
    parcours_sub: "every line was run before it was drawn",
    parcours_note: "Some boxes are blank. Not a gap — a place to write.",
    contact_pre: "Match sheet",
    contact_l1: "Next", contact_l2: "line-up",
    contact_tell: "The number 11 spot is open. Scouts, agents, clubs: it's written in black and white.",
    cta_whatsapp: "MESSAGE ON WHATSAPP", cta_mail: "SEND AN E-MAIL",
    sheet_agent: "Agent / manager", sheet_wa: "WhatsApp", sheet_mail: "E-mail",
    sticky_cta: "CONTACT",
    foot_rights: "all rights reserved",
    foot_note: "This site is black and white. The club will bring the colour.",
    stat_labels: { born: "Born", position: "Position", foot: "Strong foot", height: "Height", club: "Club" },
    season_labels: { matchs: "Apps", buts: "Goals", passes: "Assists" }
  }
};

let LANG = localStorage.getItem("e68-lang") || "fr";

function t(key, sub) {
  const d = I18N[LANG] || I18N.fr;
  return (sub ? (d[key] && d[key][sub]) : d[key]) || "";
}

function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = t(el.dataset.i18n);
    // ne pas écraser les éléments qui contiennent des nœuds imbriqués
    if (v && !el.children.length) el.textContent = v;
  });
  document.querySelectorAll(".lang-toggle span").forEach(s =>
    s.classList.toggle("active-lang", s.dataset.lang === LANG));
}

/* ---------------------------------------------------------
   Chargement des données du joueur
--------------------------------------------------------- */
const MISSING = { fr: "[À COMPLÉTER]", en: "[TO FILL]" };

function val(v) { return (v && v !== "À COMPLÉTER" && v !== "") ? v : null; }

fetch("data/player.json")
  .then(r => r.json())
  .then(P => initPlayer(P))
  .catch(err => console.warn("player.json indisponible :", err));

let PLAYER = null;

function initPlayer(P) {
  PLAYER = P;

  // Hero : phrase du joueur si elle existe (guard pour sous-pages)
  const tag = val(P.tagline_fr) && LANG === "fr" ? P.tagline_fr
            : val(P.tagline_en) && LANG === "en" ? P.tagline_en : null;
  const heroTag = document.getElementById("heroTag");
  if (tag && heroTag && !tag.includes("À COMPLÉTER")) heroTag.textContent = `« ${tag} »`;

  // Carte de scouting : photo reste, données injectées
  const rows = [
    ["born", P.born], ["position", val(P.position)], ["foot", val(P.foot)],
    ["height", val(P.height)], ["club", val(P.club)]
  ];
  const list = document.getElementById("statList");
  if (list) {
  list.innerHTML = "";
  rows.forEach(([k, v]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = t("stat_labels")[k] || k;
    dd.textContent = v || MISSING[LANG];
    if (!v) dd.classList.add("missing");
    row.append(dt, dd);
    list.append(row);
  });
  }

  // Saison
  const season = document.getElementById("statSeason");
  if (season) season.textContent = val(P.stats && P.stats.saison) || MISSING[LANG];
  const grid = document.getElementById("seasonGrid");
  if (grid) {
  grid.innerHTML = "";
  ["matchs", "buts", "passes"].forEach(k => {
    const n = P.stats && typeof P.stats[k] === "number" ? P.stats[k] : null;
    const box = document.createElement("div");
    box.innerHTML = `<b ${n === null ? 'class="missing"' : ""}>${n === null ? "—" : n}</b><span>${t("season_labels")[k]}</span>`;
    grid.append(box);
  });
  }

  // Parcours
  const steps = document.getElementById("pitchSteps");
  if (steps) {
  steps.innerHTML = "";
  (P.timeline || []).forEach(ev => {
    const empty = val(ev.annee) === null;
    const li = document.createElement("li");
    const img = ev.photo && !empty
      ? `<img class="step-visual" src="${ev.photo}" alt="" loading="lazy" decoding="async">` : "";
    li.innerHTML = `
      <div>
        <span class="step-annee">${val(ev.annee) || MISSING[LANG]}</span>
        <h3 class="step-head">${(LANG === "en" ? ev.titre_en : ev.titre_fr) || MISSING[LANG]}</h3>
        <p class="step-text">${(LANG === "en" ? ev.texte_en : ev.texte_fr) || ""}</p>
      </div>
      <div class="step-media">${img}</div>`;
    steps.append(li);
  });
  }

  // Galerie vidéo (planche contact)
  const film = document.getElementById("filmGrid");
  if (film) {
  film.innerHTML = "";
  (P.galerie || []).forEach((g, i) => {
    const frame = document.createElement("figure");
    frame.className = "film-frame";
    frame.innerHTML = `
      <video muted playsinline loop preload="none"
             data-src="${g.src}" poster="${g.poster}" aria-label="Extrait : ${LANG === "en" ? g.label_en : g.label_fr}"></video>
      <figcaption class="film-cap">
        <span>${(LANG === "en" ? g.label_en : g.label_fr)}</span><i></i>
      </figcaption>
      <span class="film-no">SH.${String(i + 1).padStart(2, "0")}</span>`;
    film.append(frame);
  });
  }

  // Contact : liens uniquement si la donnée existe — on ne ment pas
  const wa = val(P.contact && P.contact.whatsapp);
  const mail = val(P.contact && P.contact.email);
  const insta = val(P.contact && P.contact.instagram);
  const waHref = wa ? `https://wa.me/${wa.replace(/[^\d]/g, "")}` : null;
  const mailHref = mail && !mail.includes("À COMPLÉTER") ? `mailto:${mail}` : null;
  setCTA("ctaWhats", waHref, mailHref);
  setCTA("ctaMail", mailHref, waHref);
  const sheetWa = document.getElementById("sheetWa");
  const sheetMail = document.getElementById("sheetMail");
  const sheetAgent = document.getElementById("sheetAgent");
  if (sheetWa) sheetWa.textContent = wa || MISSING[LANG];
  if (sheetMail) sheetMail.textContent = mail || MISSING[LANG];
  if (sheetAgent) sheetAgent.textContent = insta || MISSING[LANG];

  buildStats();
  observeAll();
}

/* Libellés de la carte reconstruits avec la langue courante (sous-pages) */
function buildStats() {}

function setCTA(primaryId, href, fallbackHref) {
  const el = document.getElementById(primaryId);
  if (href) { el.href = href; return; }
  // si le contact principal n'est pas rempli : on ne ment pas,
  // le lien mène simplement à la feuille de contact
  el.href = "#contact";
  el.classList.add("cta-empty");
}

/* ---------------------------------------------------------
   Langue : bouton FR/EN
--------------------------------------------------------- */
const langToggle = document.getElementById("langToggle");
if (langToggle) langToggle.addEventListener("click", () => {
  LANG = LANG === "fr" ? "en" : "fr";
  localStorage.setItem("e68-lang", LANG);
  applyLang();
  if (PLAYER) initPlayer(PLAYER); // reconstruit les blocs injectés
});

/* Application de la langue au chargement */
applyLang();

/* ---------------------------------------------------------
   Préchargeur — pile ou face
--------------------------------------------------------- */
const toss = document.getElementById("toss");
if (toss) {
    function kickoff() {
    if (toss.classList.contains("done") || toss.classList.contains("launching")) return;
    toss.classList.add("launching");
    setTimeout(() => {
      toss.classList.add("done");
      document.body.classList.add("kickoff"); // la ligne médiane se trace
      const hv = document.getElementById("heroVideo");
      if (hv) hv.play().catch(() => {});
    }, REDUCED ? 0 : 700);
  }
  document.getElementById("tossBtn").addEventListener("click", kickoff);
  window.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") kickoff(); });
  const q = new URLSearchParams(location.search);
  if (q.has("kick")) kickoff(); // porte de test
  if (q.has("kick")) document.documentElement.style.scrollBehavior = "auto";
  if (REDUCED) { toss.classList.add("done"); document.body.classList.add("kickoff"); }
}

/* ---------------------------------------------------------
   Observateurs d'apparition + lecture paresseuse des vidéos
--------------------------------------------------------- */
/* Filet de sécurité : au chargement, tout ce qui est DÉJÀ à l'écran
   et jamais passé par l'IO est révélé directement. */
function revealInView() {
  const vh = window.innerHeight;
  document.querySelectorAll(".film-frame, .pitch-steps li").forEach(el => {
    const r = el.getBoundingClientRect();
    if (!el.classList.contains("seen") && r.top < vh && r.bottom > 0) el.classList.add("seen");
  });
}
function observeAll() {
  // Révélations : actives seulement si IO réellement disponible.
  const ioOK = typeof IntersectionObserver !== "undefined" && !REDUCED;
  if (ioOK) document.documentElement.classList.add("js");

  if (ioOK) {
    const once = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("seen"); once.unobserve(e.target); } });
    }, { threshold: 0.18 });

    const lazyVid = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.dataset.src; v.removeAttribute("data-src"); }
          v.play().catch(() => {
            v.addEventListener("loadedmetadata", () => { v.play().catch(() => {}); }, { once: true });
          });
        } else if (!v.paused) {
          v.pause(); // économie batterie : hors cadre = pas de décode
        }
      });
    }, { threshold: 0.25 });  document.querySelectorAll(".film-frame").forEach(f => once.observe(f));
  document.querySelectorAll(".pitch-steps li").forEach(li => once.observe(li));
  document.querySelectorAll(".rvl").forEach(f => once.observe(f)); // révélations génériques
  document.querySelectorAll(".film-frame video").forEach(v => lazyVid.observe(v));
  }
}

/* Trace du terrain quand il entre dans le cadre */
const pitch = document.querySelector(".pitch");
if (pitch) {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { pitch.classList.add("traced"); obs.disconnect(); } });
  }, { threshold: 0.35 }).observe(pitch);
}

/* ---------------------------------------------------------
   Minute du match : la barre de scroll devient le chrono
--------------------------------------------------------- */
const minute = document.getElementById("matchMinute");
if (minute && !REDUCED) {
  const setMinute = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    minute.textContent = String(Math.round(p * 90)).padStart(2, "0") + "'";
  };
  let raf = 0;
  window.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { setMinute(); raf = 0; });
  }, { passive: true });
  setMinute();
}

/* ---------------------------------------------------------
   Curseur personnalisé : point + halo, quelques-aime aimant
   sur les liens (desktop, jamais avec motion réduite)
--------------------------------------------------------- */
if (matchMedia("(pointer:fine)").matches && !REDUCED) {
  document.documentElement.classList.add("has-cursor");
  const dot = document.createElement("div");
  const ring = document.createElement("div");
  dot.className = "cursor-dot"; ring.className = "cursor-ring";
  dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
  document.body.append(ring, dot);
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; });
  (function loop() {
    rx += (x - rx) * .18; ry += (y - ry) * .18;
    dot.style.transform = `translate(${x}px,${y}px)`;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
  // grandit sur les zones cliquables
  document.addEventListener("mouseover", e => {
    ring.classList.toggle("big", !!e.target.closest("a,button"));
  });
}

/* ---------------------------------------------------------
   Lenis + GSAP/ScrollTrigger — uniquement si chargés
   et si le mouvement est autorisé
--------------------------------------------------------- */
window.addEventListener("load", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  setTimeout(revealInView, 1500); // filet : jamais de contenu fantôme

  if (REDUCED) return; // on respecte le réglage : pas de défilement piloté

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    document.documentElement.classList.add("has-lenis");
    lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    // parallaxe légère du hero (seulement desktop : plus de surface à couvrir)
    if (matchMedia("(min-width:880px)").matches) {
      // parallaxe du hero (le fond part plus vite que le nom)
      gsap.to(".hero-media video", {
        yPercent: 12, scale: 1.04, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      // le 68 géant flotte en fond de carte
      const num = document.querySelector(".card-num");
      if (num) gsap.to(num, {
        yPercent: 24, ease: "none",
        scrollTrigger: { trigger: ".scout-card", start: "top bottom", end: "bottom top", scrub: true }
      });
    }
    // le marquee penche sous la vitesse du scroll, comme un ballon poussé
    const marquee = document.querySelector(".marquee");
    if (marquee && window.Lenis) {
      let skewSetter = gsap.quickSetter(marquee, "skewY", "deg");
      ScrollTrigger.create({
        onUpdate: self => {
          const v = gsap.utils.clamp(-4, 4, self.getVelocity() / -300);
          skewSetter(v);
          gsap.to(marquee, { skewY: 0, duration: .7, ease: "power3.out", overwrite: true, delay: .05 });
        }
      });
    }
  }
});
