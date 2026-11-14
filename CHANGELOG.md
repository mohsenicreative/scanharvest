# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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

[1.0.0]: https://github.com/mohsenicreative/megascans-claimer/releases/tag/v1.0.0
