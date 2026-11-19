// Leonida Trophy Atlas: hands the guide in. main.ts (Node 22, standard library only)
// copies this repo's app/ and screenshots/ to /output and writes /output/dossier.json
// with the vendored make.fun library, as the starter's main.ts does. Two rules from
// the grader's own lessons are baked in here: the output directory itself is never
// removed (on the grader /output is a bind mount, so removing it throws EPERM), only
// its children are cleared; and the trophy file is self-checked before the dossier
// is built, so a broken list fails loudly here instead of silently at the gate.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Self-check the trophy list before anything is copied: 55 trophies, each with an
// official name and a non-blank guide of our own. The gate checks the same thing,
// so failing here saves a wasted dossier build.
const trophyPath = join(here, 'app', 'data', 'trophies.json');
const trophyDoc = JSON.parse(readFileSync(trophyPath, 'utf8'));
const trophies = trophyDoc.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`expected 55 trophies in app/data/trophies.json, found ${Array.isArray(trophies) ? trophies.length : 'no array'}`);
}
for (const t of trophies) {
  if (typeof t.name !== 'string' || !t.name.trim()) throw new Error('trophy with no name in app/data/trophies.json');
  if (typeof t.guide !== 'string' || !t.guide.trim()) throw new Error(`trophy ${t.name} has no guide`);
  if (!Array.isArray(t.sources) || t.sources.length === 0) throw new Error(`trophy ${t.name} cites no source`);
}
// Self-check the screenshots too: 3 or 4 images, each at most 256 KiB, matching
// the gate's own limits, so a bad screenshot fails here with a plain message.
const shotDir = join(here, 'screenshots');
const shotFiles = existsSync(shotDir)
  ? readdirSync(shotDir).filter((f) => statSync(join(shotDir, f)).isFile())
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}
for (const f of shotFiles) {
  const size = statSync(join(shotDir, f)).size;
  if (size > 262144) throw new Error(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
  if (!/\.(png|jpe?g)$/i.test(f)) throw new Error(`screenshot ${f} is not a PNG or JPEG`);
}
const grades = trophies.reduce((acc, t) => {
  acc[t.grade] = (acc[t.grade] ?? 0) + 1;
  return acc;
}, {});
console.log(`trophies ok: 55 (${grades.platinum ?? 0} platinum, ${grades.gold ?? 0} gold, ${grades.silver ?? 0} silver, ${grades.bronze ?? 0} bronze), ${trophies.filter((t) => t.hidden).length} hidden`);

// Clear only the output directory's children, never the directory itself: on the
// grader /output is a bind mount and rmSync(out, { recursive: true }) throws EPERM.
mkdirSync(out, { recursive: true });
for (const child of readdirSync(out)) {
  rmSync(join(out, child), { recursive: true, force: true });
}
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
writeFileSync(join(out, 'dossier.json'), dossier);
const shotCount = readdirSync(join(out, 'screenshots')).filter((f) => statSync(join(out, 'screenshots', f)).isFile()).length;
console.log(`dossier written: ${dossier.length} bytes, ${shotCount} screenshots`);
