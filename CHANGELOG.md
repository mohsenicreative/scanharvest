# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-14

### Changed
- Faster: the minimum gap between clicks is now 0.6 s (was 1.2 s). It still widens automatically when Fab is slow or asks to slow down.
- The claim engine has a new design: a queue of unclaimed listings, an adaptive pacer, frame navigation based on load events, and waits driven by DOM changes. Waiting is no longer timer-polled, so it holds up better in background tabs.
- Progress uses new storage keys. Progress saved by 1.0.0 is cleared once on update.

### Fixed
- Popup: opening "Before you start" no longer shows a wide scrollbar or leaves the popup wider with uneven padding. Scrolling now happens inside the popup with a slim dark scrollbar.
- Popup: the "Before you start" section opens and closes smoothly, and respects reduced-motion settings.

### Added
- Chrome Web Store kit in `store/`: listing texts in six languages, permission justifications, a privacy-practices guide, 1280×800 screenshots and promo tiles.
- A privacy policy page: https://mohsenicreative.github.io/megascans-claimer/privacy.html
- Releases now also include `MegascansClaimer-webstore.zip` (manifest at the zip root) and `SHA256SUMS.txt`.

## [1.0.0] - 2026-11-14

### Added
- One-click claiming of every free Quixel Megascans listing on Fab, using Fab's own *Add to My Library* button inside the student's signed-in tab.
- Full-screen progress panel on Fab with counters, elapsed time, status, Pause/Resume, Hide and Close.
- Toolbar popup with live stats, estimated time left, a retry list and tips.
- Interface in six languages (English, Persian with right-to-left layout, French, German, Spanish, Chinese), chosen with flag buttons.
- Polite pacing: at least 1.2 s between claims, backoff on "too many requests", and an automatic pause after repeated limits or unconfirmed claims.
- Saved progress that survives browser restarts; failed listings are retried on the next run.
- Toolbar badge and desktop notifications when a run finishes or needs attention.
- Multilingual student guide (GitHub Pages) and READMEs in six languages.

[1.1.0]: https://github.com/mohsenicreative/megascans-claimer/releases/tag/v1.1.0
[1.0.0]: https://github.com/mohsenicreative/megascans-claimer/releases/tag/v1.0.0
