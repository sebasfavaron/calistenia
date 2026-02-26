import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ALLOWED_EQUIPMENT = new Set(['Bodyweight','Kettlebells','Stretches','Band','TRX','Yoga','Cardio','Recovery']);
const VALID_GROUPS = ['push','pull','piernas','core','movilidad'];

const args = parseArgs(process.argv.slice(2));
const apiKey = args['api-key'] || process.env.MUSCLEWIKI_API_KEY || '';
const outRoot = args.out || 'public/data/exercises';
const manifestPath = args.manifest || 'public/data/exercises.manifest.json';
const rawRoot = args.raw || 'data/raw/musclewiki';
const concurrency = Number(args.concurrency || 4);
const limit = args.limit ? Number(args.limit) : null;
const dryRun = Boolean(args['dry-run']);
const skipMedia = Boolean(args['skip-media']);
const resume = Boolean(args.resume);
const gender = (args.gender || 'male').toLowerCase();
const angles = String(args.angles || 'front,side').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
const equipmentScope = new Set(String(args.equipment || Array.from(ALLOWED_EQUIPMENT).join(',')).split(',').map((v) => v.trim()).filter(Boolean));

if (!args['rebuild-manifest-only'] && !apiKey) {
  console.error('Missing --api-key or MUSCLEWIKI_API_KEY');
  process.exit(1);
}

await fs.mkdir(outRoot, { recursive: true });
await fs.mkdir(path.dirname(manifestPath), { recursive: true });
await fs.mkdir(rawRoot, { recursive: true });

if (args['rebuild-manifest-only']) {
  const manifest = await rebuildManifestFromDisk(outRoot);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`manifest rebuilt: ${manifest.exercises.length}`);
  process.exit(0);
}

const api = createApiClient(apiKey);
const list = await api.listExercises();
await fs.writeFile(path.join(rawRoot, 'exercises-list.json'), JSON.stringify(list, null, 2));

let candidates = list
  .map(normalizeListItem)
  .filter(Boolean)
  .filter((e) => equipmentScope.has(e.equipment) && ALLOWED_EQUIPMENT.has(e.equipment));

if (limit) candidates = candidates.slice(0, limit);

logStats(candidates);
if (dryRun) process.exit(0);

const queue = [...candidates];
const results = [];
const failures = [];

await runWorkers(concurrency, queue, async (summary) => {
  try {
    const detail = await api.getExercise(summary.id);
    await fs.writeFile(path.join(rawRoot, `${safeFile(summary.id)}.json`), JSON.stringify(detail, null, 2));
    const ex = normalizeDetail(detail, summary);
    if (!ex) throw new Error('normalizeDetail returned null');

    const dir = path.join(outRoot, ex.slug);
    await fs.mkdir(dir, { recursive: true });

    const metaPath = path.join(dir, 'meta.json');
    if (!resume || !fssync.existsSync(metaPath)) {
      await fs.writeFile(metaPath, JSON.stringify(ex, null, 2));
    }

    if (!skipMedia) {
      await syncMediaForExercise(api, detail, ex, dir, { gender, angles, resume });
    }

    const manifestEntry = await buildManifestEntryFromDir(ex, dir);
    results.push(manifestEntry);
    console.log(`OK ${ex.slug}`);
  } catch (error) {
    failures.push({ id: summary.id, name: summary.name, error: String(error?.message || error) });
    console.error(`FAIL ${summary.id}: ${error?.message || error}`);
  }
});

const manifest = buildManifest(results);
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
if (failures.length) {
  await fs.writeFile(path.join(rawRoot, 'failures.json'), JSON.stringify(failures, null, 2));
}
console.log(`done ok=${results.length} fail=${failures.length}`);

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

function createApiClient(key) {
  const base = 'https://musclewiki-api.p.rapidapi.com';
  const headers = {
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'musclewiki-api.p.rapidapi.com',
  };

  return {
    listExercises: () => fetchJson(`${base}/exercises`, headers),
    getExercise: (id) => fetchJson(`${base}/exercises/${encodeURIComponent(id)}`, headers),
    download: async (url, dest) => {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`download ${res.status} ${url}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(dest, bytes);
      return dest;
    },
  };
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} @ ${url} :: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeListItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? raw.ID ?? raw.exerciseId ?? raw.ExerciseId ?? '').trim();
  const name = String(raw.exercise_name ?? raw.name ?? raw.Name ?? '').trim() || id;
  const equipment = pickField(raw, ['equipment','Equipment']);
  const difficulty = pickField(raw, ['difficulty','Difficulty']) || 'Unknown';
  const muscle = resolveUnknownMuscle(
    pickField(raw, ['muscle','Muscle','muscle_group','MuscleGroup']) || 'Unknown',
    name
  );
  if (!id) return null;
  return { id, name, equipment, difficulty, muscle, raw };
}

function normalizeDetail(detail, fallback) {
  const id = String(detail?.id ?? detail?.ID ?? fallback.id);
  const name = pickField(detail, ['exercise_name','name','Name']) || fallback.name;
  const equipment = pickField(detail, ['equipment','Equipment']) || fallback.equipment;
  const difficulty = pickField(detail, ['difficulty','Difficulty']) || fallback.difficulty || 'Unknown';
  const muscle = resolveUnknownMuscle(
    pickField(detail, ['muscle','Muscle','muscle_group','MuscleGroup']) || fallback.muscle || 'Unknown',
    name
  );
  const secondary = arrayify(detail?.secondaryMuscles ?? detail?.secondary_muscles ?? detail?.SecondaryMuscles).map(String);
  const force = String(pickField(detail, ['force','Force']) || '').toLowerCase();
  const group = classifyGroup({ muscle, equipment, force, name });
  const slug = [muscle, equipment, difficulty, group, name].map(slugify).filter(Boolean).join('-');
  return {
    id,
    slug,
    name,
    muscle,
    musclesSecondary: secondary,
    equipment,
    difficulty,
    force,
    group,
    sourceId: id,
    sourceDetail: detail,
  };
}

function classifyGroup({ muscle, equipment, force, name }) {
  const m = String(muscle || '').toLowerCase();
  const e = String(equipment || '').toLowerCase();
  const n = String(name || '').toLowerCase();

  if (['stretches','yoga','recovery'].includes(e)) return 'movilidad';
  if (/(abs|oblique|core|lower back|erector)/.test(m)) return 'core';
  if (/(quad|hamstring|glute|calf|adductor|abductor|leg)/.test(m)) return 'piernas';
  if (/(lat|back|bicep|forearm|rear delt|trap|rhomboid)/.test(m)) return 'pull';
  if (/(pectoral|chest|tricep|shoulder|deltoid)/.test(m)) return 'push';
  if (/(stretch|mobility|recovery|yoga)/.test(n)) return 'movilidad';
  if (force === 'pull') return 'pull';
  if (force === 'push') return 'push';
  if (e === 'cardio') return 'piernas';
  return 'movilidad';
}

async function syncMediaForExercise(api, detail, ex, dir, opts) {
  const refs = extractMediaRefs(detail, opts.gender, opts.angles);
  for (const angle of opts.angles) {
    const ref = refs[angle];
    if (!ref?.url) continue;

    const ext = extFromUrl(ref.url) || (ref.kind === 'video' ? '.mp4' : '.jpg');
    const srcTmp = path.join(os.tmpdir(), `${safeFile(ex.slug)}-${angle}${ext}`);
    const targetBase = path.join(dir, angle);
    const posterPath = path.join(dir, `poster-${angle}.jpg`);

    if (opts.resume && (fssync.existsSync(`${targetBase}.webm`) || fssync.existsSync(`${targetBase}.mp4`) || fssync.existsSync(posterPath))) {
      continue;
    }

    await api.download(ref.url, srcTmp);

    if (ref.kind === 'video' || isAnimatedExt(ext)) {
      const ffmpegOk = await hasFfmpeg();
      if (ffmpegOk) {
        await convertToWebm(srcTmp, `${targetBase}.webm`);
        await convertToMp4(srcTmp, `${targetBase}.mp4`);
        await extractPoster(srcTmp, posterPath);
      } else {
        await fs.copyFile(srcTmp, `${targetBase}${ext}`);
      }
    } else {
      await fs.copyFile(srcTmp, posterPath);
    }
  }
}

function extractMediaRefs(detail, gender, angles) {
  const refs = {};
  const all = flattenMedia(detail);
  for (const angle of angles) {
    const hit = all.find((m) => m.angle === angle && m.gender === gender)
      || all.find((m) => m.angle === angle)
      || all.find((m) => m.gender === gender)
      || all[0];
    if (hit) refs[angle] = hit;
  }
  return refs;
}

function flattenMedia(detail) {
  const out = [];
  walk(detail, (value, keyPath) => {
    if (typeof value !== 'string') return;
    if (!/^https?:\/\//i.test(value)) return;
    const lower = value.toLowerCase();
    if (!/(mp4|mov|webm|gif|jpe?g|png|webp)(\?|$)/.test(lower)) return;
    const pathKey = keyPath.join('.').toLowerCase();
    const angle = pathKey.includes('side') || lower.includes('side') ? 'side' : pathKey.includes('front') || lower.includes('front') ? 'front' : null;
    const gender = pathKey.includes('female') || lower.includes('female') ? 'female' : pathKey.includes('male') || lower.includes('male') ? 'male' : null;
    const kind = /(mp4|mov|webm)(\?|$)/.test(lower) ? 'video' : /(gif)(\?|$)/.test(lower) ? 'gif' : 'image';
    out.push({ url: value, angle, gender, kind: kind === 'gif' ? 'video' : kind });
  });
  return dedupeBy(out, (m) => m.url);
}

async function buildManifestEntryFromDir(ex, dir) {
  const rel = toPublicPath(dir);
  const media = {};
  for (const angle of ['front', 'side']) {
    const webm = path.join(dir, `${angle}.webm`);
    const mp4 = path.join(dir, `${angle}.mp4`);
    const jpg = path.join(dir, `poster-${angle}.jpg`);
    const fallbackVideo = firstExisting([`${path.join(dir, angle)}.gif`, `${path.join(dir, angle)}.mov`, `${path.join(dir, angle)}.mp4`]);
    if (fssync.existsSync(webm) || fssync.existsSync(mp4)) {
      media[angle] = {
        type: 'video',
        ...(fssync.existsSync(webm) ? { webm: `${rel}/${angle}.webm` } : {}),
        ...(fssync.existsSync(mp4) ? { mp4: `${rel}/${angle}.mp4` } : {}),
        ...(fssync.existsSync(jpg) ? { poster: `${rel}/poster-${angle}.jpg` } : {}),
      };
    } else if (fssync.existsSync(jpg)) {
      media[angle] = { type: 'image', image: `${rel}/poster-${angle}.jpg`, poster: `${rel}/poster-${angle}.jpg` };
    } else if (fallbackVideo) {
      media[angle] = { type: 'video', src: `${rel}/${path.basename(fallbackVideo)}` };
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
    source: { provider: 'MuscleWiki', mode: 'offline-generated' },
    filters: {
      groups: ['todos', ...unique(exercises.map((e) => e.group))],
      muscles: ['todos', ...unique(exercises.map((e) => e.muscle))],
      equipment: ['todos', ...unique(exercises.map((e) => e.equipment))],
      difficulties: ['todos', ...unique(exercises.map((e) => e.difficulty))],
    },
    exercises,
  };
}

async function rebuildManifestFromDisk(outDir) {
  const entries = [];
  const dirs = await fs.readdir(outDir, { withFileTypes: true }).catch(() => []);
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const dir = path.join(outDir, d.name);
    const metaPath = path.join(dir, 'meta.json');
    if (!fssync.existsSync(metaPath)) continue;
    const ex = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    entries.push(await buildManifestEntryFromDir(ex, dir));
  }
  return buildManifest(entries);
}

function extractInstructions(detail) {
  const candidates = [
    detail?.instructions,
    detail?.Instructions,
    detail?.steps,
    detail?.Steps,
    detail?.exercise_instructions,
  ].filter(Boolean);

  for (const c of candidates) {
    if (Array.isArray(c)) return c.map((s) => String(s).trim()).filter(Boolean);
    if (typeof c === 'string') {
      return c.split(/\n+|\r+|\d+\.\s+/).map((s) => s.trim()).filter(Boolean);
    }
  }

  const found = [];
  walk(detail, (value, keyPath) => {
    if (found.length) return;
    const key = keyPath[keyPath.length - 1]?.toLowerCase() || '';
    if (!/instruction|step/.test(key)) return;
    if (Array.isArray(value)) found.push(...value.map((x) => String(x).trim()).filter(Boolean));
    if (typeof value === 'string') found.push(...value.split(/\n+/).map((x) => x.trim()).filter(Boolean));
  });
  return found;
}

function pickField(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && String(obj[k]).trim() !== '') return String(obj[k]).trim();
  }
  return '';
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function resolveUnknownMuscle(muscle, name) {
  if (String(muscle).toLowerCase() !== 'unknown') return muscle;
  const n = String(name || '').toLowerCase();
  if (/cervical|chin tucks?|levator scapulae/.test(n)) return 'Neck';
  if (/radial deviation/.test(n)) return 'Forearms';
  if (/elliptical/.test(n)) return 'Calves';
  if (/shoulder|rotator cuff|scapular protraction|reverse expansion teardrops/.test(n)) return 'Shoulders';
  return muscle;
}

function walk(value, visit, keyPath = []) {
  visit(value, keyPath);
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, visit, [...keyPath, String(i)]));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    walk(v, visit, [...keyPath, k]);
  }
}

function unique(list) { return [...new Set(list.filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' })); }
function slugify(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function safeFile(s) { return slugify(s) || 'file'; }
function extFromUrl(url) { try { const p = new URL(url).pathname; const ext = path.extname(p); return ext || ''; } catch { return ''; } }
function isAnimatedExt(ext) { return ['.gif'].includes(String(ext).toLowerCase()); }
function toPublicPath(absOrRelDir) { const rel = absOrRelDir.replace(/\\/g,'/').replace(/^public\//,''); return rel.startsWith('/') ? rel : `/${rel}`; }
function firstExisting(paths) { return paths.find((p) => fssync.existsSync(p)); }
function dedupeBy(arr, keyFn) { const seen = new Set(); return arr.filter((x) => { const k = keyFn(x); if (seen.has(k)) return false; seen.add(k); return true; }); }

async function hasFfmpeg() {
  return commandOk('ffmpeg', ['-version']);
}

async function commandOk(cmd, argv) {
  return new Promise((resolve) => {
    const p = spawn(cmd, argv, { stdio: 'ignore' });
    p.on('error', () => resolve(false));
    p.on('close', (code) => resolve(code === 0));
  });
}

async function runFfmpeg(args) {
  await new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
    p.on('error', reject);
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
}

function convertToWebm(input, output) {
  return runFfmpeg(['-i', input, '-an', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-pix_fmt', 'yuv420p', output]);
}
function convertToMp4(input, output) {
  return runFfmpeg(['-i', input, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', output]);
}
function extractPoster(input, output) {
  return runFfmpeg(['-ss', '00:00:00.200', '-i', input, '-frames:v', '1', output]);
}

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

function logStats(items) {
  const by = (k) => Object.entries(items.reduce((acc, it) => ((acc[it[k]] = (acc[it[k]] || 0) + 1), acc), {})).sort((a,b) => a[0].localeCompare(b[0]));
  console.log(`Candidates: ${items.length}`);
  console.log('Equipment:', by('equipment'));
  console.log('Difficulty:', by('difficulty'));
  console.log('Muscle sample:', by('muscle').slice(0, 20));
}
