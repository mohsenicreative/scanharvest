# Firefox Add-ons (AMO) submission kit

ScanHarvest runs on Firefox 140+ from the same source code. The release builds a Firefox package with its own manifest, using `tools/firefox-manifest.mjs`:

- The background runs as an event page instead of a service worker.
- The add-on ID is `scanharvest@mohsenicreative.github.io`.
- The required data-collection declaration is included: `data_collection_permissions: { required: ["none"] }`.
- Chrome-only keys are removed.

Firefox only installs **signed** add-ons, and publishing on addons.mozilla.org (AMO) signs it for free.

## 0. Test it first (2 minutes)

1. Download `ScanHarvest-firefox.zip` from the [latest release](https://github.com/mohsenicreative/scanharvest/releases/latest) and extract it.
2. In Firefox, open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and pick the extracted `manifest.json`.
3. Click the ScanHarvest toolbar icon (it may be under the puzzle-piece menu).
   - If the popup says Firefox needs permission, click **Allow access to fab.com** and accept.
4. Run about 10 items on Fab, then **Pause**.

The temporary add-on is removed when Firefox restarts. That's normal.

## 1. Create the listing

1. Sign in at https://addons.mozilla.org/developers/ with a Firefox account (free), and accept the developer agreement.
2. Click **Submit a New Add-on**, then choose **On this site** (listed).
3. Upload **`ScanHarvest-firefox.zip`**. The automatic validation should pass with no errors or warnings, which is checked in CI with `web-ext lint`.
4. **Platforms:** tick **Firefox for desktop**. Untick Android unless you want it there; Fab is a desktop workflow.
5. **Source code:** answer **No**. The package isn't minified, bundled or generated, so reviewers can read it as is.

## 2. Describe the add-on

| Field | Value |
|---|---|
| Name | ScanHarvest – bulk-add free assets to your library (taken from the package) |
| Add-on URL | `scanharvest` |
| Summary (≤ 250 chars) | Adds every free Quixel Megascans listing on Fab to your library, one by one, using Fab's own "Add to My Library" button. Polite pace, pause/resume, no passwords, no data collection. |
| Description | Paste `listing/en.txt`. AMO allows basic formatting, and the plain text works as is. |
| Categories | **Other** (alternatively *Download Management*) |
| Support email | optional: leave empty, or use an address you're happy to publish |
| Support website | https://github.com/mohsenicreative/scanharvest/issues |
| License | **MIT** |
| Privacy policy | Tick *This add-on has a privacy policy* and paste the text from https://mohsenicreative.github.io/scanharvest/privacy.html |
| Notes to reviewer | Paste the block below |

**Notes to reviewer**

> ScanHarvest only runs on https://www.fab.com/*. Sign in to Fab with any Epic Games account (free). Then open the toolbar popup and click "Open Fab Megascans & start". If prompted, grant access to fab.com.
>
> The extension loads the Free Quixel Megascans catalog in an iframe inside its own panel, then clicks Fab's own "Add to My Library" button for free listings, at least 0.6 s apart. It pauses automatically when Fab shows a rate-limit alert.
>
> No remote code, no analytics, no data collection: progress is kept in storage.local only. The source is unminified and identical to https://github.com/mohsenicreative/scanharvest at tag v1.3.0. HTML is built with DOMParser from bundled strings only; there are no innerHTML assignments.

## 3. Images

- **Icon:** taken from the package.
- **Screenshots:** upload `art/out/screenshot-1.png` … `screenshot-4.png` (1280×800). AMO accepts these as is.

## 4. Submit

- Listed add-ons are signed straight away. Mozilla's review can happen before or after it goes public; first reviews usually take from a few hours to a few days.
- Once it's live, the listing URL is `https://addons.mozilla.org/firefox/addon/scanharvest/`. Send it over so the READMEs and the guide can link to it.

## Updating

Bump `version` in `extension/manifest.json`, push a signed tag, then upload the new `ScanHarvest-firefox.zip` from the release under **Manage Status & Versions → Upload a New Version**.
