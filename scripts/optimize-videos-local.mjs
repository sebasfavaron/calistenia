import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const targetDir = path.resolve(root, args.dir || 'public/data/exercises');
const backupDir = path.resolve(root, args.backupDir || '.tmp/video-backups');
const apply = Boolean(args.apply);
const limit = Number(args.limit || 0);
const mobileWidth = Number(args.mobileWidth || 720);
const crf = Number(args.crf || 28);

if (!fssync.existsSync(targetDir)) {
  console.error(`missing dir: ${targetDir}`);
  process.exit(1);
}

const ffmpegOk = await hasCmd('ffmpeg');
const ffprobeOk = await hasCmd('ffprobe');
if (!ffmpegOk || !ffprobeOk) {
  console.error('ffmpeg/ffprobe required');
  process.exit(1);
}

const files = (await walk(targetDir))
  .filter((p) => /\.(mp4|webm)$/i.test(p))
  .sort();

const selected = limit > 0 ? files.slice(0, limit) : files;
let totalBefore = 0;
let totalAfter = 0;
let changed = 0;

console.log(`${apply ? 'APPLY' : 'DRY-RUN'} files=${selected.length} width=${mobileWidth} crf=${crf}`);
if (apply) await fs.mkdir(backupDir, { recursive: true });

for (const file of selected) {
  const before = (await fs.stat(file)).size;
  totalBefore += before;
  const meta = await probe(file).catch(() => null);
  const width = meta?.streams?.find((s) => s.codec_type === 'video')?.width ?? null;
  const height = meta?.streams?.find((s) => s.codec_type === 'video')?.height ?? null;
  const codec = meta?.streams?.find((s) => s.codec_type === 'video')?.codec_name ?? '?';
  const shouldScale = width && width > mobileWidth;
  const rel = path.relative(root, file);

  if (!apply) {
    console.log(`[plan] ${rel} ${codec} ${fmt(before)}${width ? ` ${width}x${height}` : ''}${shouldScale ? ` -> <=${mobileWidth}w` : ''}`);
    totalAfter += before;
    continue;
  }

  const backupPath = path.join(backupDir, rel);
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  if (!fssync.existsSync(backupPath)) {
    await fs.copyFile(file, backupPath);
  }

  const ext = path.extname(file).toLowerCase();
  const tmpOut = `${file}.tmp-opt${ext}`;
  const scale = shouldScale ? `scale='min(${mobileWidth},iw)':-2:flags=lanczos` : null;
  const common = ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-an', '-movflags', '+faststart'];
  const vf = scale ? ['-vf', scale] : [];
  const codecArgs = ext === '.webm'
    ? ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-row-mt', '1']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p'];

  await run('ffmpeg', [...common, ...vf, ...codecArgs, tmpOut]);
  const after = (await fs.stat(tmpOut)).size;

  if (after >= before) {
    await fs.unlink(tmpOut).catch(() => {});
    totalAfter += before;
    console.log(`[skip] ${rel} ${fmt(before)} -> ${fmt(after)} (not smaller)`);
    continue;
  }

  await fs.rename(tmpOut, file);
  totalAfter += after;
  changed += 1;
  console.log(`[ok] ${rel} ${fmt(before)} -> ${fmt(after)} (${pct(before, after)})`);
}

console.log(`changed=${changed}/${selected.length}`);
console.log(`total ${fmt(totalBefore)} -> ${fmt(totalAfter)} (${pct(totalBefore, totalAfter)})`);
if (apply) console.log(`backup dir: ${path.relative(root, backupDir)}`);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const [k, inline] = token.slice(2).split('=');
    let value = inline;
    if (value == null && argv[i + 1] && !argv[i + 1].startsWith('--')) value = argv[++i];
    out[k] = value ?? true;
  }
  return out;
}

async function hasCmd(cmd) {
  try {
    await run('sh', ['-lc', `command -v ${cmd} >/dev/null 2>&1`], { quiet: true });
    return true;
  } catch {
    return false;
  }
}

async function probe(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', file], { capture: true, quiet: true });
  return JSON.parse(stdout);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (buf) => {
      const s = String(buf);
      stdout += s;
      if (!opts.quiet && !opts.capture) process.stdout.write(s);
    });
    child.stderr.on('data', (buf) => {
      const s = String(buf);
      stderr += s;
      if (!opts.quiet) process.stderr.write(s);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

function fmt(bytes) {
  if (!Number.isFinite(bytes)) return '?';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

function pct(before, after) {
  if (!before) return 'n/a';
  const delta = ((after - before) / before) * 100;
  return `${delta.toFixed(1)}%`;
}
