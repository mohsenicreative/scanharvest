// Consistency checks run in CI and before a release:  node tools/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

let failed = false;
const fail = msg => { console.error(`✗ ${msg}`); failed = true; };
const ok = msg => console.log(`✓ ${msg}`);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// 1. Syntax of every script.
const scripts = [
  ...readdirSync(new URL('../extension', import.meta.url)).filter(f => f.endsWith('.js')).map(f => `extension/${f}`),
  'docs/i18n-guide.js', 'docs/assets/icons.js', 'docs/assets/flags.js', 'tools/preview-stub.js'
];
for (const file of scripts) {
  try { execFileSync(process.execPath, ['--check', fileURLToPath(new URL(`../${file}`, import.meta.url))]); }
  catch { fail(`syntax error in ${file}`); }
}
ok(`syntax of ${scripts.length} scripts`);

// 2. JSON files.
const manifest = JSON.parse(read('extension/manifest.json'));
for (const dir of readdirSync(new URL('../extension/_locales', import.meta.url))) {
  const messages = JSON.parse(read(`extension/_locales/${dir}/messages.json`));
  for (const key of ['extName', 'extDescription']) if (!messages[key]?.message) fail(`_locales/${dir} is missing ${key}`);
  if (messages.extDescription?.message.length > 132) fail(`_locales/${dir} description is longer than 132 characters`);
}
ok(`manifest ${manifest.version} and locales`);

// 3. Every language has every string.
function load(file, global) {
  const sandbox = { navigator: { language: 'en' }, window: {}, chrome: undefined };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read(file), sandbox);
  return global(sandbox);
}
function compare(name, dict) {
  const base = Object.keys(dict.en);
  for (const [lang, strings] of Object.entries(dict)) {
    const missing = base.filter(k => !(k in strings));
    const extra = Object.keys(strings).filter(k => !base.includes(k));
    if (missing.length) fail(`${name}: ${lang} is missing ${missing.join(', ')}`);
    if (extra.length) fail(`${name}: ${lang} has unknown keys ${extra.join(', ')}`);
    for (const k of base) {
      const want = (dict.en[k].match(/\{\w+\}/g) || []).sort().join();
      const got = ((strings[k] || '').match(/\{\w+\}/g) || []).sort().join();
      if (want !== got) fail(`${name}: ${lang}.${k} placeholders ${got || '(none)'} ≠ ${want || '(none)'}`);
    }
  }
  ok(`${name}: ${Object.keys(dict).length} languages × ${base.length} strings`);
}
const ext = load('extension/i18n.js', s => s.I18N);
// The dictionary is private to i18n.js, so evaluate just that object literal.
const extSource = read('extension/i18n.js');
const dictSource = extSource.slice(extSource.indexOf('const STRINGS = '), extSource.indexOf('const supported'));
compare('extension', vm.runInNewContext(`(() => { ${dictSource}; return STRINGS; })()`));
compare('guide', load('docs/i18n-guide.js', s => s.window.GUIDE_STRINGS));

// 4. Flags exist for every language.
const flags = load('extension/flags.js', s => s.FLAGS);
for (const l of ext.LANGS) if (!flags[l.code]) fail(`missing flag for ${l.code}`);
ok('flags for every language');

// 5. The guide's copies of shared assets are up to date.
for (const f of ['icons.js', 'flags.js']) {
  if (read(`extension/${f}`) !== read(`docs/assets/${f}`)) fail(`docs/assets/${f} is out of date: run build.ps1 or copy it from extension/`);
}
ok('docs/assets in sync');

if (failed) process.exit(1);
