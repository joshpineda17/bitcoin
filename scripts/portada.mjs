// Finds and downloads freely licensed cover photos from Wikimedia Commons.
//   node scripts/portada.mjs buscar "El Zonte beach"
//   node scripts/portada.mjs bajar "File:Some photo.jpg" <slug>
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'CacaoMediaBuild/1.0 (https://cacaomedia.sv)' };
const LIBRE = /^(cc0|public domain|pd|cc by(-sa)? \d)/i;

const limpiar = (html = '') =>
  html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 80);

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
  }
  throw new Error(`Commons API failed: ${url}`);
}

const info = (p) => {
  const ii = p.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  return {
    titulo: p.title,
    ancho: ii.width,
    alto: ii.height,
    mime: ii.mime,
    licencia: limpiar(m.LicenseShortName?.value),
    autor: limpiar(m.Artist?.value) || 'Autor desconocido',
    pagina: ii.descriptionurl,
    miniatura: ii.thumburl,
    descripcion: limpiar(m.ImageDescription?.value),
  };
};

const IIPROP = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1920' };

async function buscar(consulta) {
  const d = await api({
    action: 'query', generator: 'search', gsrsearch: `${consulta} filetype:bitmap`,
    gsrnamespace: '6', gsrlimit: '40', ...IIPROP,
  });
  const fotos = Object.values(d.query?.pages ?? {})
    .map(info)
    .filter((f) => f && f.mime === 'image/jpeg' && f.ancho >= 1600 && LIBRE.test(f.licencia))
    .filter((f) => f.ancho / f.alto >= 1.2 && f.ancho / f.alto <= 2.1);
  if (!fotos.length) return console.log('SIN RESULTADOS. Probá otra consulta, más corta o en inglés.');
  for (const f of fotos.slice(0, 12)) {
    console.log(`${f.titulo}\n   ${f.ancho}x${f.alto} · ${f.licencia} · ${f.autor}\n   ${f.descripcion}`);
  }
}

async function bajar(titulo, slug) {
  const d = await api({ action: 'query', titles: titulo, ...IIPROP });
  const f = Object.values(d.query?.pages ?? {}).map(info)[0];
  if (!f) throw new Error(`No existe: ${titulo}`);
  if (!LIBRE.test(f.licencia)) throw new Error(`Licencia no permitida: ${f.licencia}`);
  let r;
  for (let i = 0; i < 4; i++) {
    r = await fetch(f.miniatura, { headers: UA });
    if (r.ok) break;
    await new Promise((ok) => setTimeout(ok, 2000 * (i + 1)));
  }
  if (!r.ok) throw new Error(`Descarga falló: ${r.status}`);
  const jpg = await sharp(Buffer.from(await r.arrayBuffer()))
    .resize({ width: 1600, height: 1000, fit: 'cover', position: 'attention' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await writeFile(`public/portadas/${slug}.jpg`, jpg);
  const q = (s) => `'${s.replace(/'/g, "''")}'`;
  console.log(`GUARDADA public/portadas/${slug}.jpg (${Math.round(jpg.length / 1024)} KB)\nPegá esto en el frontmatter:`);
  console.log(`portada: /portadas/${slug}.jpg\ncredito: ${q(f.autor)}\nlicencia: ${q(f.licencia)}\ncreditoUrl: ${q(f.pagina)}`);
}

const [modo, a, b] = process.argv.slice(2);
if (modo === 'buscar' && a) await buscar(a);
else if (modo === 'bajar' && a && b) await bajar(a, b);
else console.log('Uso: buscar "<consulta>"  |  bajar "File:..." <slug>');
