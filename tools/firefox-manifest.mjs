// Writes a Firefox-flavoured manifest.json into a copy of the extension folder.
// Usage: node tools/firefox-manifest.mjs <extension copy dir>
//
// Differences from the Chrome manifest:
//   - background runs as an event page (Firefox has no MV3 service workers);
//     i18n.js is listed first because importScripts() is unavailable there.
//   - browser_specific_settings: add-on ID, minimum version and the data
//     collection declaration addons.mozilla.org requires for new add-ons.
//   - Chrome-only keys are removed.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node tools/firefox-manifest.mjs <dir>');
const file = join(dir, 'manifest.json');
const manifest = JSON.parse(readFileSync(file, 'utf8'));

manifest.background = { scripts: ['i18n.js', 'background.js'] };
delete manifest.minimum_chrome_version;
manifest.browser_specific_settings = {
  gecko: {
    id: 'scanharvest@mohsenicreative.github.io',
    strict_min_version: '140.0',
    data_collection_permissions: { required: ['none'] }
  },
  // The data collection declaration needs Firefox for Android 142+.
  gecko_android: { strict_min_version: '142.0' }
};

writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Firefox manifest written to ${file}`);
