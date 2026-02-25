import fs from 'node:fs';
import path from 'node:path';

const manifestPath = process.argv[2] || 'public/data/exercises.manifest.json';
const root = process.cwd();

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exitCode = 1;
}

if (!fs.existsSync(manifestPath)) {
  fail(`manifest not found: ${manifestPath}`);
  process.exit();
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const exercises = Array.isArray(manifest.exercises) ? manifest.exercises : [];
const validGroups = new Set(['push', 'pull', 'piernas', 'core', 'movilidad']);

for (const ex of exercises) {
  if (!ex.slug) fail(`missing slug for ${ex.name || ex.id}`);
  if (!validGroups.has(ex.group)) fail(`invalid group ${ex.group} in ${ex.slug}`);
  for (const angle of ['front', 'side']) {
    const media = ex.media?.[angle];
    if (!media) continue;
    for (const key of ['webm', 'mp4', 'poster', 'image', 'src']) {
      if (!media[key]) continue;
      const mediaAbs = resolveStaticPath(media[key]);
      if (!fs.existsSync(mediaAbs)) fail(`missing media ${angle}.${key}: ${media[key]} (${ex.slug})`);
    }
  }
}

const present = {
  groups: new Set(exercises.map((e) => e.group).filter(Boolean)),
  muscles: new Set(exercises.map((e) => e.muscle).filter(Boolean)),
  equipment: new Set(exercises.map((e) => e.equipment).filter(Boolean)),
  difficulties: new Set(exercises.map((e) => e.difficulty).filter(Boolean)),
};

for (const [key, vals] of Object.entries(manifest.filters || {})) {
  const checkKey = key === 'groups' ? 'groups' : key;
  if (!present[checkKey]) continue;
  for (const v of vals) {
    if (v === 'todos') continue;
    if (!present[checkKey].has(v)) fail(`filter value not present: filters.${key} -> ${v}`);
  }
}

if (!process.exitCode) {
  console.log(`Manifest OK: ${exercises.length} exercises`);
}

function resolveStaticPath(p) {
  if (p.startsWith('/')) return path.join(root, 'public', p.slice(1));
  return path.join(root, p);
}
