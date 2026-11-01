# Eterling68 — site de NKENZO Sterling

Site one-page en noir et blanc. Le contenu public vient de `data/player.json`.
Le site est à la racine du dépôt (GitHub Pages).

## Modifier les textes et les données
- Tout le contenu joueur vit dans `data/player.json`.
- Un champ vide est masqué sur le site public. Aucun `[À COMPLÉTER]` n'est
  affiché par défaut.
- Le mode `?debug=1` affiche les champs manquants pour le travail interne.
- Les valeurs bilingues utilisent la forme `{ "fr": "…", "en": "…" }`.
- Ne rien inventer : une donnée absente reste vide et son bloc est masqué.

### Champs principaux
- `name`, `brand`, `jersey_number`
- `born`, `nationality`, `position`, `other_positions`, `foot`, `height`, `status`
- `parcours[]` : `annee`, `titre_fr`, `titre_en`, `texte_fr`, `texte_en`, `photo`
- `contact` : `whatsapp`, `email`, `manager`, `instagram`
- `galerie[]` : `src`, `poster`, `label_fr`, `label_en`

## Ajouter / remplacer une vidéo
1. Poser la source dans `Captures/`.
2. Convertir en N&B court et léger :
   `ffmpeg -i "source.mp4" -t 8 -vf "hue=s=0,eq=contrast=1.1" -r 30 -c:v libx264 -crf 27 -an -movflags +faststart media/video/mon-clip.mp4`
3. Générer un poster (1ʳᵉ image) :
   `ffmpeg -i mon-clip.mp4 -frames:v 1 mon-clip-poster.jpg`
4. Ajouter une entrée dans `galerie` : `src`, `poster`, `label_fr`, `label_en`, `duree`.
   La planche contact du site est reconstruite automatiquement.

## Ajouter une photo
Convertir en gris : `convert IMG.JPG -colorspace Gray -strip -quality 82 media/img/nom.webp`
puis référencer dans `parcours[].photo`.

## Performance et accessibilité
- Vidéos : boucles courtes, sans son, chargées seulement à l'entrée dans le
  cadre, mises en pause quand elles sortent de l'écran.
- Sur mobile : défilement natif (pas de Lenis), grain statique, vidéos en
  lecture paresseuse.
- `prefers-reduced-motion` : grain, défilement piloté et tracés désactivés.
- Navigation clavier, contrastes élevés, textes alternatifs.
