# Chrome Web Store submission kit

Everything needed to publish **Megascans Claimer** on the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). The same package and texts also work for [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge/overview), which is free.

## 1. Package

Upload **`MegascansClaimer-webstore.zip`**. In that zip, `manifest.json` sits at the root, which the store requires. You can get it in either of two ways:

- Attached to every [GitHub release](https://github.com/mohsenicreative/megascans-claimer/releases/latest).
- Built locally with `pwsh -File build.ps1`, which writes it to `dist/`.

> Don't upload `MegascansClaimer.zip`. That one has a top-level folder, so students can extract it and use *Load unpacked*.

## 2. Store listing tab

| Field | Value |
|---|---|
| Title | Taken from the package: *Megascans Claimer for Fab* (localized from `_locales`) |
| Summary | Taken from the package (`extDescription`, ≤ 132 characters, localized) |
| Description | Paste from `listing/<language>.txt`. Add each language under *Localization* in the dashboard. |
| Category | **Productivity › Tools** (Education is a reasonable alternative) |
| Language | English (default), then add فارسی, Français, Deutsch, Español and 中文 (简体) |
| Store icon | `extension/icons/128.png` |
| Screenshots (1280×800) | `art/out/screenshot-1.png` … `screenshot-4.png` |
| Small promo tile (440×280) | `art/out/promo-small.png` |
| Marquee (1400×560, optional) | `art/out/promo-marquee.png` |
| Official URL | none |
| Homepage URL | https://mohsenicreative.github.io/megascans-claimer/ |
| Support URL | https://github.com/mohsenicreative/megascans-claimer/issues |

## 3. Privacy practices tab

**Single purpose**

> Adds the free Quixel Megascans listings on fab.com to the signed-in user's Fab library by pressing Fab's own "Add to My Library" button, one listing at a time, with a visible progress panel.

**Permission justifications**

| Permission | Justification |
|---|---|
| `storage` | Saves the user's progress (counters, processed listing URLs, items to retry) and the chosen interface language locally, so a run can be paused and resumed. Nothing is sent anywhere. |
| `notifications` | Shows a desktop notification when a run finishes or pauses, because a full run takes hours and usually happens in the background. |
| Host permission `https://www.fab.com/*` | The extension only works on Fab. It runs on the Free Quixel Megascans page to show its progress panel and press Fab's own Add to My Library button. It has no access to any other site. |

**Remote code:** No, I am not using remote code. All JavaScript is in the package.

**Data usage:** don't tick any data type; the extension collects none. Then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://mohsenicreative.github.io/megascans-claimer/privacy.html

## 4. Distribution tab

- Visibility: **Public**, or **Unlisted** if only people with the link should find it, for example your class.
- Regions: all regions.

## 5. Review notes

Paste this into the *notes for reviewer* field if the dashboard asks for test instructions:

> Sign in at https://www.fab.com with any Epic Games account (a free account works). Open the extension popup and click "Open Fab Megascans & start". The Free Quixel Megascans page opens with a progress panel. The extension presses Fab's own "Add to My Library" button for free listings, at least 0.6 s apart, and pauses automatically if Fab shows a rate-limit message. Pause/Resume are in the panel and popup. No data leaves the browser.

## 6. After it's published

1. Copy the store URL, which looks like `https://chromewebstore.google.com/detail/<id>`.
2. Add it to `README*.md` and `docs/index.html` as the main install button. Students then install with one click and get updates automatically.
3. For each new version, bump `version` in `extension/manifest.json`, push a signed tag, and upload the new `MegascansClaimer-webstore.zip` from the release.

## Regenerating the images

```bash
python -m http.server 5178
```

```bash
pwsh -File store/art/render.ps1
```

The images are rendered with headless Microsoft Edge from `store/art/art.html`, using the screenshots in `docs/images/`.
