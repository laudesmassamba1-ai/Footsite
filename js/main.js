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
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;
const PARAMS = new URLSearchParams(location.search);
const DEBUG = PARAMS.has("debug");

/* ---------------------------------------------------------
   i18n
--------------------------------------------------------- */
const I18N = {
  fr: {
    nav_action: "Vidéos", nav_profil: "Profil", nav_parcours: "Parcours", nav_contact: "Contact",
    toss_btn: "Coup d'envoi",
    action_title: "Vidéos",
    parcours_title: "Parcours",
    contact_title: "Contact",
    contact_tell: "Pour un essai ou un échange.",
    contact_sheet_link: "Fiche contact complète",
    manager_label: "Manager",
    cta_whatsapp: "Écrire sur WhatsApp",
    back_home: "Retour au site",
    foot_rights: "tous droits réservés",
    sheet_agent: "Agent / manager", sheet_wa: "WhatsApp", sheet_mail: "E-mail", sheet_insta: "Instagram", app_gmail: "Gmail",
    stat_labels: {
      position: "Poste", other_positions: "Autres postes", foot: "Pied fort",
      nationality: "Nationalité", born: "Né en", height: "Taille", status: "Statut"
    }
  },
  en: {
    nav_action: "Videos", nav_profil: "Profile", nav_parcours: "Background", nav_contact: "Contact",
    toss_btn: "Kick-off",
    action_title: "Videos",
    parcours_title: "Background",
    contact_title: "Contact",
    contact_tell: "For a trial or a chat.",
    contact_sheet_link: "Full contact sheet",
    manager_label: "Manager",
    cta_whatsapp: "Message on WhatsApp",
    back_home: "Back to site",
    foot_rights: "all rights reserved",
    sheet_agent: "Agent / manager", sheet_wa: "WhatsApp", sheet_mail: "E-mail", sheet_insta: "Instagram", app_gmail: "Gmail",
    stat_labels: {
      position: "Position", other_positions: "Other positions", foot: "Strong foot",
      nationality: "Nationality", born: "Born", height: "Height", status: "Status"
    }
  }
};

let LANG = localStorage.getItem("e68-lang") || "fr";
let PLAYER = null;
let observers = [];

const MISSING = { fr: "[À COMPLÉTER]", en: "[TO FILL]" };

function t(key, sub) {
  const d = I18N[LANG] || I18N.fr;
  return (sub ? (d[key] && d[key][sub]) : d[key]) || "";
}

function pick(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v[LANG] ?? v.fr ?? v.en ?? "";
  }
  return v;
}

function val(v) {
  const x = pick(v);
  if (Array.isArray(x)) return x.length ? x : null;
  if (typeof x === "string") {
    const s = x.trim();
    if (!s || s === "À COMPLÉTER" || s === "[À COMPLÉTER]" || s === "[TO FILL]") return null;
    return s;
  }
  return x || null;
}

function display(v) {
  const x = val(v);
  if (Array.isArray(x)) return x.join(", ");
  return x || "";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function formatDuration(v) {
  if (v == null || v === "") return "";
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return String(v);
  const s = (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "").replace(".", LANG === "en" ? "." : ",");
  return `${s} s`;
}

function formatPhone(v) {
  if (!v) return "";
  const d = String(v).replace(/[^\d+]/g, "");
  if (d.startsWith("+242") && d.length === 13) {
    return `+242 ${d.slice(4, 7)} ${d.slice(7, 10)} ${d.slice(10)}`;
  }
  return String(v);
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
fetch("data/player.json")
  .then(r => r.json())
  .then(P => initPlayer(P))
  .catch(err => console.warn("player.json indisponible :", err));

function initPlayer(P) {
  PLAYER = P;
  renderProfile(P);
  renderParcours(P);
  renderGalerie(P);
  renderContact(P);
  observeAll();
}

/* Profil : seules les données présentes sont affichées. */
function renderProfile(P) {
  const list = document.getElementById("statList");
  if (!list) return;

  const rows = [
    ["position", P.position],
    ["other_positions", P.other_positions],
    ["foot", P.foot],
    ["nationality", P.nationality],
    ["born", P.born],
    ["height", P.height],
    ["status", P.status]
  ];

  list.innerHTML = "";
  rows.forEach(([key, raw]) => {
    const value = display(raw);
    if (!value && !DEBUG) return;
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = t("stat_labels")[key] || key;
    dd.textContent = value || MISSING[LANG];
    if (!value) dd.classList.add("missing");
    row.append(dt, dd);
    list.append(row);
  });
}

/* Parcours : une seule mention factuelle. Les cases vides sont masquées. */
function renderParcours(P) {
  const section = document.getElementById("parcours");
  const steps = document.getElementById("pitchSteps");
  if (!steps) return;

  const items = (P.parcours || []).map(ev => ({
    annee: display(ev.annee),
    titre: display({ fr: ev.titre_fr, en: ev.titre_en }),
    texte: display({ fr: ev.texte_fr, en: ev.texte_en }),
    photo: val(ev.photo)
  })).filter(ev => ev.annee || ev.titre || ev.texte || ev.photo);

  if (!items.length && !DEBUG) {
    if (section) section.hidden = true;
    return;
  }

  steps.innerHTML = "";
  items.forEach(ev => {
    const year = ev.annee || (DEBUG ? MISSING[LANG] : "");
    const title = ev.titre || (DEBUG ? MISSING[LANG] : "");
    const text = ev.texte || (DEBUG ? MISSING[LANG] : "");
    const img = ev.photo
      ? `<img class="step-visual" src="${esc(ev.photo)}" alt="" loading="lazy" decoding="async">`
      : "";
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        ${year ? `<span class="step-annee">${esc(year)}</span>` : ""}
        ${title ? `<h3 class="step-head">${esc(title)}</h3>` : ""}
        ${text ? `<p class="step-text">${esc(text)}</p>` : ""}
      </div>
      ${img ? `<div class="step-media">${img}</div>` : ""}`;
    steps.append(li);
  });
}

/* Galerie vidéo : la légende dit ce que montre le clip. */
function renderGalerie(P) {
  const section = document.getElementById("action");
  const film = document.getElementById("filmGrid");
  if (!film) return;

  const items = (P.galerie || []).filter(g => val(g.src));
  if (!items.length && !DEBUG) {
    if (section) section.hidden = true;
    return;
  }

  film.innerHTML = "";
  items.forEach(g => {
    const label = display({ fr: g.label_fr, en: g.label_en }) || (DEBUG ? MISSING[LANG] : "");
    const duree = formatDuration(g.duree);
    const frame = document.createElement("figure");
    frame.className = "film-frame";
    frame.innerHTML = `
      <video muted playsinline loop preload="none"
             data-src="${esc(g.src)}" poster="${esc(g.poster || "")}"
             aria-label="${esc((LANG === "en" ? "Video: " : "Vidéo : ") + label)}"></video>
      <figcaption class="film-cap">
        <span>${esc(label)}</span><i></i>
      </figcaption>
      ${duree ? `<span class="film-no">${esc(duree)}</span>` : ""}`;
    film.append(frame);
  });
}

/* Contact : icônes d'applications et fiche, construites depuis les données. */
const ICONS = {
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  gmail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>'
};

function renderContact(P) {
  const c = P.contact || {};
  const wa = val(c.whatsapp);
  const mail = val(c.email);
  const manager = val(c.manager);
  const insta = val(c.instagram);
  const waHref = wa ? `https://wa.me/${wa.replace(/[^\d]/g, "")}` : null;
  const mailHref = mail ? `mailto:${mail}` : null;
  const instaHandle = insta ? (insta.match(/instagram\.com\/([^/?#]+)/i)?.[1] || insta.replace(/^@/, "")) : null;
  const instaHref = insta ? (/^https?:\/\//i.test(insta) ? insta : `https://instagram.com/${insta.replace(/^@/, "")}`) : null;

  const section = document.querySelector(".contact");
  const tell = document.querySelector(".contact-tell");
  const number = document.getElementById("contactNumber");
  const managerLine = document.getElementById("contactManager");
  const actions = document.getElementById("contactActions");

  if (tell) {
    if (wa || mail || insta) tell.textContent = t("contact_tell");
    else if (!DEBUG) { if (section) section.hidden = true; }
    else tell.textContent = MISSING[LANG];
  }

  if (number) {
    if (wa) number.textContent = formatPhone(wa);
    else if (mail) number.textContent = mail;
    else number.textContent = DEBUG ? MISSING[LANG] : "";
  }

  if (managerLine) {
    managerLine.replaceChildren();
    if (manager) {
      const label = document.createElement("span");
      label.textContent = t("manager_label");
      managerLine.append(label, document.createTextNode(manager));
      managerLine.hidden = false;
    } else if (DEBUG) {
      const label = document.createElement("span");
      label.textContent = t("manager_label");
      managerLine.append(label, document.createTextNode(MISSING[LANG]));
      managerLine.hidden = false;
    } else {
      managerLine.hidden = true;
    }
  }

  if (actions) {
    const apps = [
      {
        label: t("sheet_wa"), href: waHref, icon: ICONS.whatsapp, external: true,
        title: wa ? `${t("sheet_wa")} : ${formatPhone(wa)}` : null
      },
      {
        label: t("sheet_insta"), href: instaHref, icon: ICONS.instagram, external: true,
        title: insta ? `${t("sheet_insta")} : @${instaHandle}` : null
      },
      {
        label: t("app_gmail"), href: mailHref, icon: ICONS.gmail, external: false,
        title: mail ? `${t("app_gmail")} : ${mail}` : null
      }
    ];
    actions.replaceChildren();
    let shown = 0;
    apps.forEach(app => {
      if (!app.href && !DEBUG) return;
      const el = document.createElement(app.href ? "a" : "span");
      el.className = "app-link" + (app.href ? "" : " is-missing");
      if (app.href) {
        el.href = app.href;
        if (app.external) { el.target = "_blank"; el.rel = "noopener"; }
      } else {
        el.setAttribute("aria-disabled", "true");
      }
      const label = app.title || `${app.label} ${MISSING[LANG]}`;
      el.setAttribute("aria-label", label);
      el.title = label;
      el.innerHTML = `${app.icon}<span class="app-name">${esc(app.label)}</span>`;
      actions.append(el);
      shown++;
    });
    actions.hidden = !shown;
  }

  const sheet = document.getElementById("contactSheet");
  if (sheet) {
    const rows = [
      ["sheet_agent", manager, null],
      ["sheet_wa", wa ? formatPhone(wa) : null, waHref],
      ["sheet_mail", mail, mailHref],
      ["sheet_insta", insta ? `@${instaHandle}` : null, instaHref]
    ];
    sheet.innerHTML = "";
    let shown = 0;
    rows.forEach(([key, value, href]) => {
      if (!value && !DEBUG) return;
      const div = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = t(key);
      if (href && value) {
        const a = document.createElement("a");
        a.href = href;
        if (key !== "sheet_mail") { a.target = "_blank"; a.rel = "noopener"; }
        a.textContent = value;
        dd.append(a);
      } else {
        dd.textContent = value || MISSING[LANG];
      }
      if (!value) dd.classList.add("missing");
      div.append(dt, dd);
      sheet.append(div);
      shown++;
    });
    sheet.hidden = !shown;
  }
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

applyLang();

/* ---------------------------------------------------------
   Nom du hero : découpe en lettres (cascade du coup d'envoi).
   Le <h1> garde son aria-label : les lettres sont décoratives.
--------------------------------------------------------- */
const heroName = document.querySelector(".hero-name");
if (heroName) {
  const cuts = [...heroName.querySelectorAll(".cut")];
  const spoken = cuts.length ? cuts.map(el => el.textContent.trim()).join(" ") : heroName.textContent;
  heroName.setAttribute("aria-label", spoken.replace(/\s+/g, " ").trim());
  heroName.querySelectorAll(".cut").forEach(span => {
    const txt = span.textContent;
    span.textContent = "";
    [...txt].forEach((ch, i) => {
      const s = document.createElement("i");
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      s.style.setProperty("--i", i);
      span.append(s);
    });
  });
}

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
      document.body.classList.add("kickoff");
      const hv = document.getElementById("heroVideo");
      if (hv && !REDUCED) hv.play().catch(() => {});
    }, REDUCED ? 0 : 700);
  }
  const tossBtn = document.getElementById("tossBtn");
  if (tossBtn) tossBtn.addEventListener("click", kickoff);
  window.addEventListener("keydown", e => {
    if (toss.classList.contains("done")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      kickoff();
    }
  });
  if (PARAMS.has("kick")) {
    kickoff();
    document.documentElement.style.scrollBehavior = "auto";
  }
  if (REDUCED) {
    toss.classList.add("done");
    document.body.classList.add("kickoff");
  }
}

/* ---------------------------------------------------------
   Observateurs d'apparition + lecture paresseuse des vidéos
--------------------------------------------------------- */
/* Filet de sécurité : au chargement, tout ce qui est DÉJÀ à l'écran
   et jamais passé par l'IO est révélé directement. */
function revealInView() {
  const vh = window.innerHeight;
  document.querySelectorAll(".film-frame, .pitch-steps li, .rvl").forEach(el => {
    const r = el.getBoundingClientRect();
    if (!el.classList.contains("seen") && r.top < vh && r.bottom > 0) el.classList.add("seen");
  });
}

function observeAll() {
  observers.forEach(o => o.disconnect());
  observers = [];

  const ioOK = typeof IntersectionObserver !== "undefined" && !REDUCED;
  if (!ioOK) return;

  document.documentElement.classList.add("js");

  const once = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("seen");
        once.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });

  const lazyVid = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src) {
          v.src = v.dataset.src;
          v.removeAttribute("data-src");
        }
        v.play().catch(() => {
          v.addEventListener("loadedmetadata", () => { v.play().catch(() => {}); }, { once: true });
        });
      } else if (!v.paused) {
        v.pause(); // économie batterie : hors cadre = pas de décode
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll(".film-frame").forEach(f => once.observe(f));
  document.querySelectorAll(".pitch-steps li").forEach(li => once.observe(li));
  document.querySelectorAll(".rvl").forEach(f => once.observe(f));
  document.querySelectorAll(".film-frame video").forEach(v => lazyVid.observe(v));

  observers.push(once, lazyVid);
}

/* La vidéo du hero se met en pause dès qu'elle sort du cadre. */
const heroVideo = document.getElementById("heroVideo");
if (heroVideo && typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (document.body.classList.contains("kickoff") && !REDUCED) heroVideo.play().catch(() => {});
      } else if (!heroVideo.paused) {
        heroVideo.pause();
      }
    });
  }, { threshold: 0.15 }).observe(heroVideo);
}

/* Trace du terrain quand il entre dans le cadre */
const pitch = document.querySelector(".pitch");
if (pitch && typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { pitch.classList.add("traced"); obs.disconnect(); } });
  }, { threshold: 0.35 }).observe(pitch);
}

/* Cursor : point + halo, only on fine pointers, never with reduced motion */
if (FINE_POINTER && !REDUCED) {
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
  document.addEventListener("mouseover", e => {
    ring.classList.toggle("big", !!e.target.closest("a,button"));
  });
}

/* ---------------------------------------------------------
   Lenis + GSAP/ScrollTrigger — uniquement si chargés,
   sur pointeur fin et si le mouvement est autorisé
--------------------------------------------------------- */
window.addEventListener("load", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  setTimeout(revealInView, 1500); // filet : jamais de contenu fantôme

  if (REDUCED) return; // on respecte le réglage : pas de défilement piloté

  if (window.Lenis && FINE_POINTER) {
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
      gsap.to(".hero-media video", {
        yPercent: 12, scale: 1.04, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
      const num = document.querySelector(".card-num");
      if (num) gsap.to(num, {
        yPercent: 24, ease: "none",
        scrollTrigger: { trigger: ".scout-card", start: "top bottom", end: "bottom top", scrub: true }
      });
    }
  }
});
