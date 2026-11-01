# Eterling68 — site de NKENZO Sterling

Site one-page en **noir et blanc strict**. Concept : *Terrain d'argent* — la
planche contact de la rue + la feuille de match. Déploiement : glisser le
dossier `site/` sur Netlify (ou Vercel).

## Modifier les textes
- Tout le contenu joueur vit dans `site/data/player.json`.
- Champs marqués `À COMPLÉTER` : laisser `""` ou la mention telle quelle
  affiche un tiret `—` sur le site. Rien n'est inventé par le code.
- Réponses FR/EN : les libellés de langue sont dans `site/js/main.js`
  (constante `I18N`). Les textes du joueur (tagline, timeline) sont dans le
  JSON, un champ pour chaque langue.

## Ajouter / remplacer une vidéo
1. Poser la source dans `Captures/`.
2. Convertir en N&B court et léger :
   `ffmpeg -i "source.mp4" -t 8 -vf "hue=s=0,eq=contrast=1.1" -r 30 -c:v libx264 -crf 27 -an -movflags +faststart media/video/mon-clip.mp4`
3. Générer un poster (1ʳᵉ image) :
   `ffmpeg -i mon-clip.mp4 -frames:v 1 mon-clip-poster.jpg`
4. Ajouter une entrée dans `galerie` (player.json) : src, poster, label_fr, label_en, duree.
   La planche contact du site est reconstruite automatiquement.

## Ajouter une photo
Convertir en gris : `convert IMG.JPG -colorspace Gray -strip -quality 82 media/img/nom.webp`
puis référencer dans `timeline[].photo` (petite version ~560px de large conseillée).

## Remplir les infos joueur
`position`, `foot`, `height`, `club`, `stats` (saison), `palmares`,
`timeline` (années + textes), `contact` (whatsapp, email, instagram),
et l'URL du site dans la balise `og:url` de `site/index.html`.

## Performance & accessibilité
- Vidéos : boucles courtes, sans son, chargées seulement à l'entrée dans le
  cadre, mises en pause quand elles sortent de l'écran.
- `prefers-reduced-motion` : grain, défilement piloté et tracés désactivés.
- Navigation clavier, contrastes élevés, textes alternatifs.
