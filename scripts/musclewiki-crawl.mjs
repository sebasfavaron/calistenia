import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ALLOWED_EQUIPMENT = new Set(['Bodyweight','Kettlebells','Stretches','Band','TRX','Yoga','Cardio','Recovery']);
const VALID_GROUPS = ['push','pull','piernas','core','movilidad'];

const args = parseArgs(process.argv.slice(2));
const sitemapUrl = args.sitemap || 'https://musclewiki.com/sitemap.xml';
const outRoot = args.out || 'public/data/exercises';
const manifestPath = args.manifest || 'public/data/exercises.manifest.json';
const rawRoot = args.raw || 'data/raw/musclewiki-crawl';
const concurrency = Number(args.concurrency || 4);
const limit = args.limit ? Number(args.limit) : null;
const dryRun = Boolean(args['dry-run']);
const skipMedia = Boolean(args['skip-media']);
const resume = Boolean(args.resume);
const saveRaw = Boolean(args['save-raw']);
const transcode = Boolean(args.transcode);
const gender = (args.gender || 'male').toLowerCase();
const angles = String(args.angles || 'front,side').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
const equipmentScope = new Set(String(args.equipment || Array.from(ALLOWED_EQUIPMENT).join(',')).split(',').map((v) => v.trim()).filter(Boolean));

await fs.mkdir(outRoot, { recursive: true });
await fs.mkdir(path.dirname(manifestPath), { recursive: true });
await fs.mkdir(rawRoot, { recursive: true });

const xml = await fetchText(sitemapUrl);
await fs.writeFile(path.join(rawRoot, 'sitemap.xml'), xml);
let urls = extractExerciseUrls(xml);
urls = urls.filter((url) => {
  const guessed = inferEquipmentFromSlug(url.split('/exercise/')[1] || '');
  return !guessed || guessed === 'Unsupported' ? guessed !== 'Unsupported' : equipmentScope.has(guessed) && ALLOWED_EQUIPMENT.has(guessed);
});
if (limit) urls = urls.slice(0, limit);
console.log(`sitemap exercises: ${urls.length}`);

const queue = [...urls];
const collected = [];
const failures = [];

await runWorkers(concurrency, queue, async (url) => {
  try {
    const slugFromUrl = url.split('/exercise/')[1]?.replace(/\/+$/, '') || '';
    const html = await fetchText(url);

    const parsed = parseExercisePage(html, url);
    if (!parsed) throw new Error('No ExerciseAction JSON-LD found');
    const ex = normalizeParsed(parsed, { gender, angles });
    if (!equipmentScope.has(ex.equipment) || !ALLOWED_EQUIPMENT.has(ex.equipment)) return;
    if (saveRaw) {
      await fs.writeFile(path.join(rawRoot, `${safeFile(slugFromUrl || 'page')}.html`), html);
    }
    const dir = path.join(outRoot, ex.slug);
    await fs.mkdir(dir, { recursive: true });

    if (!resume || !fssync.existsSync(path.join(dir, 'meta.json'))) {
      await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(ex, null, 2));
    }
    if (!dryRun && !skipMedia) {
      await syncMediaFromParsed(ex, dir, { resume, transcode });
    }

    collected.push(await buildManifestEntryFromDir(ex, dir));
    console.log(`OK ${ex.slug}`);
  } catch (error) {
    failures.push({ url, error: String(error?.message || error) });
    console.error(`FAIL ${url}: ${error?.message || error}`);
  }
});

const manifest = buildManifest(collected);
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
if (failures.length) {
  await fs.writeFile(path.join(rawRoot, 'failures.json'), JSON.stringify(failures, null, 2));
}
console.log(`done ok=${collected.length} fail=${failures.length} dryRun=${dryRun}`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const [k, inline] = token.slice(2).split('=');
    if (inline !== undefined) out[k] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; CalisteniaBot/1.0)' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; CalisteniaBot/1.0)' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchBufferWithFallbacks(url) {
  let lastError = null;
  for (const candidate of urlCandidates(url)) {
    try {
      return await fetchBuffer(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`download failed @ ${url}`);
}

function urlCandidates(url) {
  const out = [];
  const push = (u) => { if (u && !out.includes(u)) out.push(u); };
  push(url);
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/');
    const last = segments.at(-1);
    if (last) {
      const lowerLast = last.toLowerCase();
      if (lowerLast !== last) {
        const v = new URL(url);
        const p = v.pathname.split('/');
        p[p.length - 1] = lowerLast;
        v.pathname = p.join('/');
        push(v.toString());
      }
    }
    if (u.pathname.toLowerCase() !== u.pathname) {
      const v = new URL(url);
      v.pathname = u.pathname.toLowerCase();
      push(v.toString());
    }
  } catch {}
  return out;
}

function extractExerciseUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/musclewiki\.com\/exercise\/[^<]+)<\/loc>/g)].map((m) => m[1]);
}

function parseExercisePage(html, url) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let ld = null;
  for (const text of scripts) {
    try {
      const data = JSON.parse(text);
      if (data && (data['@type'] === 'ExerciseAction' || (Array.isArray(data['@graph']) && data['@graph'].some((x) => x?.['@type'] === 'ExerciseAction')))) {
        ld = data['@type'] === 'ExerciseAction' ? data : data['@graph'].find((x) => x?.['@type'] === 'ExerciseAction');
        break;
      }
    } catch {}
  }
  if (!ld) return null;

  const mediaMatches = [...html.matchAll(/https:\/\/media\.musclewiki\.com\/[^"'<>\s]+\.(?:gif|mp4|webm|jpe?g|png|webp)/gi)].map((m) => m[0]);
  const media = dedupeBy(mediaMatches, (m) => m).map((u) => parseMediaUrl(u)).filter(Boolean);

  return {
    url,
    urlSlug: url.split('/exercise/')[1]?.replace(/\/+$/, '') || '',
    name: String(ld.name || '').trim(),
    descriptionHtml: String(ld.description || ''),
    equipment: String(ld.equipment || ld.exerciseType || '').trim(),
    difficulty: String(ld.difficulty || 'Unknown').trim(),
    muscleGroup: arrayify(ld.muscleGroup),
    secondaryMuscleGroups: arrayify(ld.secondaryMuscleGroups),
    imagesLd: arrayify(ld.image),
    media,
    correctSteps: extractCorrectStepsFromHtml(html),
  };
}

function parseMediaUrl(url) {
  const lower = url.toLowerCase();
  const kind = /\.(mp4|webm)$/.test(lower) ? 'video' : /\.gif$/.test(lower) ? 'gif' : 'image';
  const gender = /female/.test(lower) ? 'female' : /male/.test(lower) ? 'male' : null;
  const angle = /side/.test(lower) ? 'side' : /front/.test(lower) ? 'front' : null;
  return { url, kind: kind === 'gif' ? 'video' : kind, gender, angle };
}

function normalizeParsed(parsed, opts) {
  const name = parsed.name || parsed.url.split('/exercise/')[1].replace(/-/g, ' ');
  const equipment = normalizeEquipment(inferEquipment(parsed) || parsed.equipment || 'Unknown');
  const difficulty = normalizeDifficulty(parsed.difficulty || 'Unknown');
  const muscle = normalizeMuscle(parsed.muscleGroup[0] || 'Unknown');
  const force = '';
  const group = classifyGroup({ muscle, equipment, force, name });
  const slug = [muscle, equipment, difficulty, group, name].map(slugify).filter(Boolean).join('-');
  const steps = parsed.correctSteps?.length ? parsed.correctSteps : htmlToSteps(parsed.descriptionHtml);
  const selectedMedia = selectAngles(parsed.media, opts.gender, opts.angles, parsed.imagesLd);
  const posterRefs = selectPosterRefs(parsed.imagesLd, opts.gender, opts.angles);

  return {
    id: parsed.url,
    sourceUrl: parsed.url,
    slug,
    name,
    muscle,
    musclesSecondary: parsed.secondaryMuscleGroups.map(normalizeMuscle),
    equipment,
    difficulty,
    force,
    group,
    steps,
    mediaRefs: selectedMedia,
    posterRefs,
  };
}

function extractCorrectStepsFromHtml(html) {
  const blockMatch = html.match(/\\"correct_steps\\":\[(.*?)\],\\"variation_of\\":/s);
  if (!blockMatch) return [];
  const block = blockMatch[1];
  const texts = [];
  for (const m of block.matchAll(/\\"text_en_us\\":\\"(.*?)\\"/g)) {
    const t = unescapeJsString(m[1]).trim();
    if (t) texts.push(t);
  }
  if (!texts.length) {
    for (const m of block.matchAll(/\\"text\\":\\"(.*?)\\"/g)) {
      const t = unescapeJsString(m[1]).trim();
      if (t) texts.push(t);
    }
  }
  return dedupeBy(texts, (x) => x);
}

function selectAngles(media, gender, angles, ldImages) {
  const refs = {};
  for (const angle of angles) {
    const ranked = [...media].sort((a, b) => rankMedia(b) - rankMedia(a));
    const hit = ranked.find((m) => m.gender === gender && m.angle === angle && m.kind === 'video')
      || ranked.find((m) => m.gender === gender && m.angle === angle)
      || ranked.find((m) => m.angle === angle && m.kind === 'video')
      || ranked.find((m) => m.angle === angle)
      || null;
    if (hit) {
      refs[angle] = hit;
      continue;
    }
    const fallbackImg = ldImages.find((u) => new RegExp(`${gender}.*${angle}|${angle}.*${gender}`, 'i').test(u))
      || ldImages.find((u) => new RegExp(angle, 'i').test(u))
      || ldImages[0];
    if (fallbackImg) refs[angle] = parseMediaUrl(fallbackImg);
  }
  return refs;
}
function selectPosterRefs(ldImages, gender, angles) {
  const refs = {};
  for (const angle of angles) {
    const hit = ldImages.find((u) => new RegExp(`${gender}.*${angle}|${angle}.*${gender}`, 'i').test(u))
      || ldImages.find((u) => new RegExp(angle, 'i').test(u))
      || ldImages[0];
    if (hit) refs[angle] = hit;
  }
  return refs;
}
function rankMedia(m) {
  const u = String(m?.url || '').toLowerCase();
  let score = 0;
  if (u.endsWith('.webm')) score += 40;
  if (u.endsWith('.mp4')) score += 30;
  if (u.endsWith('.gif')) score += 10;
  if (m?.gender === 'male') score += 4;
  if (m?.angle) score += 2;
  return score;
}

function htmlToSteps(html) {
  const chunks = [];
  const listItems = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]));
  if (listItems.length) chunks.push(...listItems);
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1]));
  for (const p of paragraphs) {
    if (!p) continue;
    if (chunks.includes(p)) continue;
    chunks.push(p);
  }
  return chunks.filter(Boolean);
}

function stripTags(s) {
  return decodeHtml(String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function unescapeJsString(s) {
  return String(s || '')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

async function syncMediaFromParsed(ex, dir, { resume, transcode }) {
  for (const angle of ['front', 'side']) {
    try {
      const ref = ex.mediaRefs?.[angle];
      if (!ref?.url) continue;
      const targetBase = path.join(dir, angle);
      const posterPath = path.join(dir, `poster-${angle}.jpg`);
      if (resume && (fssync.existsSync(`${targetBase}.webm`) || fssync.existsSync(`${targetBase}.mp4`) || fssync.existsSync(posterPath))) {
        continue;
      }

      const ext = extFromUrl(ref.url) || (ref.kind === 'video' ? '.mp4' : '.jpg');
      const tmp = path.join(os.tmpdir(), `${safeFile(ex.slug)}-${angle}${ext}`);
      const buf = await fetchBufferWithFallbacks(ref.url);
      await fs.writeFile(tmp, buf);

      const posterUrl = ex.posterRefs?.[angle];
      if (posterUrl && (!resume || !fssync.existsSync(posterPath))) {
        try {
          const posterBuf = await fetchBufferWithFallbacks(posterUrl);
          await fs.writeFile(posterPath, posterBuf);
        } catch {}
      }

      if (ref.kind === 'video' || ext.toLowerCase() === '.gif') {
        if (transcode && await hasFfmpeg()) {
          await convertToWebm(tmp, `${targetBase}.webm`);
          await convertToMp4(tmp, `${targetBase}.mp4`);
          if (!fssync.existsSync(posterPath)) {
            await extractPoster(tmp, posterPath);
          }
        } else {
          const outExt = ext.toLowerCase() === '.webm' ? '.webm' : ext.toLowerCase() === '.mp4' ? '.mp4' : '.gif';
          await fs.copyFile(tmp, `${targetBase}${outExt}`);
        }
      } else {
        if (!fssync.existsSync(posterPath)) await fs.copyFile(tmp, posterPath);
      }
    } catch (error) {
      console.warn(`WARN media ${ex.slug} ${angle}: ${error?.message || error}`);
    }
  }
}

async function buildManifestEntryFromDir(ex, dir) {
  const rel = toPublicPath(dir);
  const media = {};
  for (const angle of ['front', 'side']) {
    const webm = path.join(dir, `${angle}.webm`);
    const mp4 = path.join(dir, `${angle}.mp4`);
    const jpg = path.join(dir, `poster-${angle}.jpg`);
    const gif = path.join(dir, `${angle}.gif`);
    if (fssync.existsSync(webm) || fssync.existsSync(mp4)) {
      media[angle] = {
        type: 'video',
        ...(fssync.existsSync(webm) ? { webm: `${rel}/${angle}.webm` } : {}),
        ...(fssync.existsSync(mp4) ? { mp4: `${rel}/${angle}.mp4` } : {}),
        ...(fssync.existsSync(jpg) ? { poster: `${rel}/poster-${angle}.jpg` } : {}),
      };
    } else if (fssync.existsSync(jpg)) {
      media[angle] = { type: 'image', image: `${rel}/poster-${angle}.jpg`, poster: `${rel}/poster-${angle}.jpg` };
    } else if (fssync.existsSync(gif)) {
      media[angle] = { type: 'video', src: `${rel}/${angle}.gif` };
    }
  }

  return {
    id: ex.id,
    slug: ex.slug,
    name: ex.name,
    muscle: ex.muscle,
    musclesSecondary: ex.musclesSecondary,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    group: VALID_GROUPS.includes(ex.group) ? ex.group : 'movilidad',
    angles: Object.keys(media),
    media,
    tags: [ex.group, ex.muscle, ex.equipment, ex.difficulty].filter(Boolean).map((s) => String(s).toLowerCase()),
  };
}

function buildManifest(entries) {
  const exercises = entries.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  return {
    generatedAt: new Date().toISOString(),
    source: { provider: 'MuscleWiki', mode: 'offline-crawled-html' },
    filters: {
      groups: ['todos', ...unique(exercises.map((e) => e.group))],
      muscles: ['todos', ...unique(exercises.map((e) => e.muscle))],
      equipment: ['todos', ...unique(exercises.map((e) => e.equipment))],
      difficulties: ['todos', ...unique(exercises.map((e) => e.difficulty))],
    },
    exercises,
  };
}

function normalizeEquipment(v) {
  const s = String(v || '').trim();
  const map = {
    'Bodyweight': 'Bodyweight',
    'Kettlebell': 'Kettlebells',
    'Kettlebells': 'Kettlebells',
    'Band': 'Band',
    'Resistance Band': 'Band',
    'TRX': 'TRX',
    'Yoga': 'Yoga',
    'Stretches': 'Stretches',
    'Stretch': 'Stretches',
    'Cardio': 'Cardio',
    'Recovery': 'Recovery',
  };
  return map[s] || s;
}
function inferEquipment(parsed) {
  const slug = String(parsed.urlSlug || '').toLowerCase();
  const tokens = slug.split('-').filter(Boolean);
  const first = tokens[0] || '';
  const firstTwo = tokens.slice(0, 2).join('-');
  const firstThree = tokens.slice(0, 3).join('-');

  const map = new Map([
    ['kettlebell', 'Kettlebells'],
    ['kettlebells', 'Kettlebells'],
    ['trx', 'TRX'],
    ['band', 'Band'],
    ['resistance-band', 'Band'],
    ['yoga', 'Yoga'],
    ['stretch', 'Stretches'],
    ['stretches', 'Stretches'],
    ['cardio', 'Cardio'],
    ['recovery', 'Recovery'],
    ['bodyweight', 'Bodyweight'],
    ['pull-ups', 'Bodyweight'],
    ['push-ups', 'Bodyweight'],
    ['chin-ups', 'Bodyweight'],
    ['box-dips', 'Bodyweight'],
    ['bench-dips', 'Bodyweight'],
    ['crunches', 'Bodyweight'],
    ['glute-bridge', 'Bodyweight'],
    ['bulgarian-split-squat', 'Bodyweight'],
  ]);

  const candidates = [firstThree, firstTwo, first, slug];
  for (const c of candidates) {
    if (map.has(c)) return map.get(c);
  }

  if (/(^|-)barbell(-|$)|(^|-)dumbbell(-|$)|(^|-)machine(-|$)|(^|-)smith(-|$)|(^|-)cable(-|$)/.test(slug)) {
    return 'Unsupported';
  }

  return '';
}
function inferEquipmentFromSlug(urlSlug) {
  return inferEquipment({ urlSlug });
}
function normalizeDifficulty(v) { return String(v || 'Unknown').trim().replace(/\s+/g, ' '); }
function normalizeMuscle(v) { return String(v || 'Unknown').trim().replace(/\s+/g, ' '); }

function classifyGroup({ muscle, equipment, force, name }) {
  const m = String(muscle || '').toLowerCase();
  const e = String(equipment || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (['stretches','yoga','recovery'].includes(e)) return 'movilidad';
  if (/(abs|abdominal|oblique|core|lower back|erector)/.test(m)) return 'core';
  if (/(quad|hamstring|glute|calf|calves|adductor|abductor|leg)/.test(m)) return 'piernas';
  if (/(lat|back|bicep|forearm|rear delt|trap|rhomboid)/.test(m)) return 'pull';
  if (/(pectoral|chest|tricep|shoulder|deltoid)/.test(m)) return 'push';
  if (/(stretch|mobility|recovery|yoga)/.test(n)) return 'movilidad';
  if (force === 'pull') return 'pull';
  if (force === 'push') return 'push';
  if (e === 'cardio') return 'piernas';
  return 'movilidad';
}

function arrayify(v) {
  if (!v) return [];
  return Array.isArray(v) ? v.map(String) : [String(v)];
}
function unique(list) { return [...new Set(list.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' })); }
function slugify(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function safeFile(s) { return slugify(s) || 'file'; }
function dedupeBy(arr, keyFn) { const seen = new Set(); return arr.filter((x) => { const k = keyFn(x); if (seen.has(k)) return false; seen.add(k); return true; }); }
function extFromUrl(url) { try { return path.extname(new URL(url).pathname) || ''; } catch { return ''; } }
function toPublicPath(dir) { const rel = dir.replace(/\\/g, '/').replace(/^public\//, ''); return rel.startsWith('/') ? rel : `/${rel}`; }

async function hasFfmpeg() { return commandOk('ffmpeg', ['-version']); }
async function commandOk(cmd, argv) { return new Promise((resolve) => { const p = spawn(cmd, argv, { stdio: 'ignore' }); p.on('error', () => resolve(false)); p.on('close', (code) => resolve(code === 0)); }); }
async function runFfmpeg(args) { await new Promise((resolve, reject) => { const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); p.on('error', reject); p.on('close', (c) => c === 0 ? resolve() : reject(new Error(`ffmpeg exit ${c}`))); }); }
function convertToWebm(input, output) { return runFfmpeg(['-i', input, '-an', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-pix_fmt', 'yuv420p', output]); }
function convertToMp4(input, output) { return runFfmpeg(['-i', input, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', output]); }
function extractPoster(input, output) { return runFfmpeg(['-ss', '00:00:00.200', '-i', input, '-frames:v', '1', output]); }

async function runWorkers(max, queue, worker) {
  const workers = Array.from({ length: Math.max(1, max) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      await worker(item);
    }
  });
  await Promise.all(workers);
}
