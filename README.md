# Res Ipsa: Bar Prep

A Duolingo-style study companion for the bar exam. You walk Bar City's Town Square with Bailey the Bailiff Beagle, finish Today's Rounds (about 10 minutes of spaced-repetition review, new rules, and practice on your weak spots), and earn XP, streaks, ranks and passport stamps. There are no hearts and no lockouts.

**Live test build:** https://cbur10.github.io/res-ipsa/

## Run locally
```
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Publish
Every push to `main` builds the app with Vite (`BASE_PATH=/res-ipsa/`) and deploys it to GitHub Pages through `.github/workflows/pages.yml`.

## Content
The lesson content is in `src/content.json` (FRE 801 hearsay sample, still a draft). Item types are `rule_card`, `fill_blank`, `mcq`, `true_false` and `boss`.

## Reset progress
Profile tab → **Reset progress**. Progress is stored in localStorage under the key `resipsa.v1`.
