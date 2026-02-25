# MuscleWiki Data Source Notes

- Provider: MuscleWiki API (RapidAPI host `musclewiki-api.p.rapidapi.com`)
- Purpose: local one-shot ingest to generate static repository assets (media + steps + manifest)
- Runtime behavior: no production/runtime API calls; frontend reads local manifest + local files only
- Scope filters: `Bodyweight,Kettlebells,Stretches,Band,TRX,Yoga,Cardio,Recovery`
- Variants: `male` + angles `front,side`

## Permission / Compliance

- Owner indicated there is written permission for bulk local storage outside default public API terms.
- Keep evidence out of repo if sensitive.
- Regenerate data only from local ingest command (no manual scraping in frontend runtime).

## Ingest Command (planned)

```bash
npm run sync -- --api-key <KEY> --limit 10
```

## Notes

- `scripts/musclewiki-sync.mjs` is schema-tolerant and may need field mapping updates if API payloads differ.
- `scripts/validate-manifest.mjs` should be run after every sync.
