# Leonida Platinum Atlas — GTA 6 Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/mumun110795/gta6-trophy-guide-v3/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/mumun110795/gta6-trophy-guide-v3/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft
Auto VI. Every trophy carries its official name, description and grade, a
guide in our own words, and the sources that guide rests on, named beside it.

- **Tracker** — checklist with per-grade platinum progress, counters for the
  counted trophies (42 Shooting Range challenges, 250 stunt jumps, …),
  progress saved in the browser (localStorage), exportable and importable
  as a JSON file.
- **Filters & spoiler shield** — filter by story, missable, collectibles,
  activities or online, by grade, or by search; hidden story trophies stay
  blurred until earned or revealed.
- **Roadmap to Platinum** — a four-stage plan built from the official
  descriptions: story first with the missable watchpoints flagged in order,
  then collectibles, activities, and clean-up.
- **Missables** — seven trophies that can be permanently missed, each with
  the reason and its point of no return.

The app is plain static files under `app/` — no build step, no network at
runtime. `main.ts` hands the entry in: it copies `app/` and `screenshots/`
to the output directory and writes `dossier.json`.

Entry for the [make.fun GTA 6 Trophy Guide bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?ref=vdsf53gd&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
