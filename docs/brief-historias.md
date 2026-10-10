# Brief for story writers

You write stories for Cacao Media, a Spanish-language publication about El Salvador
("Historias de El Salvador, grano a grano"). Each story is one Markdown file in
`src/content/historias/<slug>.md` plus one real cover photo in `public/portadas/<slug>.jpg`.

Work only in those two folders. Never edit any other file. Never run npm, git, astro, or any command
other than `node scripts/portada.mjs ...`. Run every command from `C:\Users\joshb\Documents\CacaoMedia`.

## File format

Read `src/content/historias/la-ola-que-cambio-un-pueblo.md` first and copy its structure.

```yaml
---
titulo: <given to you, verbatim>
bajada: <one sentence, under 140 characters, no final hype>
seccion: <given: cronica | guia | cultura | cafe>
fecha: <given, YYYY-MM-DD>
autor: Redacción Cacao
lugar: <given>
coords: <approximate, format 13.49°N · 89.44°W>
minutos: <integer, words / 200, rounded up>
precio: 120
portada: /portadas/<slug>.jpg
alt: <what the photo literally shows, one sentence, in Spanish>
credito: <from the script>
licencia: <from the script>
creditoUrl: <from the script>
tags: [<2 or 3 from the tag list below>]
---
```

- Slug: the title in lowercase, no accents, no punctuation, words joined by `-`, at most 7 words.
- Free stories (marked "gratis" in your list): add `gratis: true`, set `precio: 0`, and do NOT include
  the gate marker.
- Quote any YAML value that contains a colon, starts with `[`, or contains `#`.
- Tags, pick only from this list: Surf, Playa, La Libertad, Oriente, Occidente, Volcanes, Lagos,
  Senderismo, Naturaleza, Pueblos, Artesanía, Comida, Pupusas, Tradiciones, Historia, Arqueología,
  Arte, Música, Centro Histórico, San Salvador, Café, Cosecha, Ruta de las Flores, Santa Ana,
  Turismo, Guía rápida, Noche.

## Body

- 450 to 650 words of Spanish prose. No opening blockquote, no "texto de muestra" note.
- Structure: 2 or 3 opening paragraphs, then a line that is exactly `<!-- gate -->` (paid stories
  only), then 2 or 3 sections each with a `## ` heading in sentence case and 2 paragraphs. Guides may
  include one short list.
- Voice: warm, concrete, direct, a little dry. Salvadoran voseo when addressing the reader (tenés,
  pedí, andá, llevá). Short sentences. Describe what a visitor sees, hears, smells and eats.
- No em dashes or en dashes anywhere. Use commas, colons, periods.
- The first paragraph must hook without clichés. Never write "joya escondida", "paraíso",
  "mágico", "sin duda", "no te lo podés perder".

## Accuracy rules (strict)

These stories are published. Everything must be true to the best of your general knowledge.

- Do NOT invent people, quotes, interviews, businesses, hotels, restaurants, fincas, prices,
  schedules, phone numbers, bus routes, statistics, dates or events.
- Do NOT write in the first person as a reporter who was there ("hablé con", "me contó").
  Write as an informed essay or guide in the second or third person.
- Only state facts you are confident about: geography, well-known history, well-known dishes and
  traditions, widely known place names. If you are not sure of a number or a date, leave it out and
  stay general ("hace siglos", "a poco más de una hora de la capital").
- For practical advice, stay generic and safe: go early, bring water, hire a local guide, check
  conditions before you go. Never promise that something is open, safe or free.

## Cover photo (real, freely licensed, from Wikimedia Commons)

1. Search: `node scripts/portada.mjs buscar "<query>"`. Queries work best short, as a place or
   thing name, in English or Spanish: `"Coatepeque"`, `"Suchitoto"`, `"pupusas"`,
   `"coffee cherries El Salvador"`. If you get `SIN RESULTADOS` or nothing relevant, try other
   queries (at least 4 different ones) before settling.
2. Pick a candidate whose title and description match your story's place or subject.
3. Download: `node scripts/portada.mjs bajar "File:Exact title.jpg" <slug>`.
4. Look at it: use the Read tool on `public/portadas/<slug>.jpg`. Keep it only if it is sharp,
   well lit, attractive as a magazine cover, and clearly relevant. Otherwise download a different
   candidate with the same slug (it overwrites) and look again. Try up to 4 candidates.
5. Paste the four frontmatter lines the script printed (`portada`, `credito`, `licencia`,
   `creditoUrl`) exactly as printed.
6. Write `alt` from what you actually see in the photo.

Photo rules:
- The photo must really show the place or subject, or something honestly generic for the topic
  (coffee cherries for a coffee story). It must be from El Salvador when the story is about a
  specific Salvadoran place. Do not use a photo of a different country's place.
- No photos whose main subject is an identifiable person, a politician, an official event, a child,
  a logo, a map, a diagram, a flag, a painting, or a document. Landscapes, streets, buildings,
  food, crafts and nature only.
- No two stories may share the same photo.

## When you finish

Report in under 120 words: the slugs you created, and for any story where you could not find a
good photo, say so plainly and which photo you used instead.

---

# Round 2: upgrade pass (overrides anything above that conflicts)

You are upgrading EXISTING stories. Never rename a file. Never change `titulo`, `seccion`, `fecha`,
`lugar`, `precio`, `gratis`, or add or remove the `<!-- gate -->` line (paid stories keep exactly one,
free stories have none). Edit each story with the Edit tool or rewrite it fully with Write, one story
at a time. Only touch the story files assigned to you and their cover in `public/portadas/`.

## Photos: the bar is a magazine cover

The current covers were picked fast and many are mediocre. For each story:

1. Look at the current cover with Read (`public/portadas/<slug>.jpg`).
2. Build contact sheets of candidates, at least 3 different queries per story:
   `node scripts/portada.mjs hoja "<query>" <any-short-name>` then Read `.hojas/<any-short-name>.jpg`.
   The sheet shows up to 12 numbered thumbnails; the printed list maps numbers to file titles.
   Thumbnails labelled PREMIADA are award-winning Commons photos: prefer them when relevant.
   Good queries are short: a place name, a landmark, a dish, a thing. Try Spanish and English, the
   municipality, the department, and nearby landmarks.
3. Choose the single most striking photo that truly shows the story's place or subject: strong
   light, clear subject, good composition, sharp, no date stamps, no watermarks, no clutter.
   Golden hour, dramatic skies, saturated colour and close food shots win. Hazy, flat, tilted,
   overexposed or snapshot-looking photos lose.
4. Download it: `node scripts/portada.mjs bajar "File:Exact title.jpg" <slug>`, then Read
   `public/portadas/<slug>.jpg` at full size to confirm it survived the 16:10 crop. If the script
   says the photo is already used by another story, pick another.
5. Replace the current cover only if the new one is clearly better. If you replace it, update
   `credito`, `licencia`, `creditoUrl` with the printed lines and rewrite `alt` from what you see.
6. If the photo is not of the exact place (for example a neighbouring beach), the `alt` must name
   what and where it really is. Never use a photo from another country for a story about a specific
   Salvadoran place.

All other photo rules above still apply (no identifiable person as the main subject, no officials,
logos, maps, paintings).

## Text

- Keep every accuracy rule above. No invented people, quotes, businesses, prices, statistics.
- Fix anything that breaks the voice rules: clichés, filler, em dashes, generic travel-brochure lines.
- Set `minutos` to the body word count divided by 200, rounded up.
