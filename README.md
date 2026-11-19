# Leonida Trophy Atlas — GTA VI Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/dunoil/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/dunoil/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online.

## What it is

- **Every trophy, official and complete.** Each of the 55 trophies is shown with its official name, description and grade as PlayStation publishes them (as listed by Exophase and PSNProfiles, 18 Nov 2026).
- **A guide for each trophy, in our own words, with its source named beside it.** What to do, where and how, and when it can be missed. The facts come chiefly from PowerPyx's GTA 6 Trophy Guide & Roadmap, cross-checked against the lists at Of Zen and Computing, Output Lag, GTA Zone, GTA Vice City Hub, KeenGamer, Leonida Intel, Insider Gaming and EGamers. Five trophies have no confirmed method at launch: their guides say so plainly instead of guessing.
- **Roadmap to the platinum.** Eight stages in order, from the story (Chapters 1-5) through the side-character finales, Strangers & Freaks, map exploration, races and stunts, robberies, collectibles and money, to the 100% completion cleanup. About 200 hours, difficulty 4/10.
- **One trophy can be missed.** Positive Mental Attitude is the only trophy any guide flags as potentially missable: Lucia's Chapter 1 balcony meditation disappears after Chapter 1. The atlas warns about it up front and on the trophy itself.
- **A tracker.** A checklist saved in the browser (localStorage), exportable to a file and importable back. Filters by kind (story, missable, collectibles, activities, platinum & 100%, online), by grade, and by search. A spoiler setting hides the names, descriptions and guides of story trophies until they are earned.

## Run it

Static files under `app/`, no build step. Serve `app/` with any static server, or run `node serve.ts` and open http://localhost:8080. It works in desktop Chrome with the network off: it loads nothing from outside its own files.

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library. Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. See [LICENSE](LICENSE).
