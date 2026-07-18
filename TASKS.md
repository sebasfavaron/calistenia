# Tasks

## Fields
- `id`: stable handle for future chats
- `status`: current execution state
- `goal`: concrete outcome
- `source`: where it came from
- `workspace`: per-task folder for notes/artifacts
- `next_step`: immediate next action
- `notes`: short implementation context
- `tags`: optional cross-task labels

## Items

### T-042.1 - Add pain-frequency training guardrail
- status: `done`
- goal: add a calistenia cheat-sheet page that turns health-system's knee/shoulder pain frequency rules into a pre-session action guide
- source: `T-042; health-system/logic/decision_tree.md; health-system/logic/escalation_rules.md`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-14: published `semaforo-dolor.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow integration; no health-system data is read at runtime because this static GitHub Pages app cannot access the sibling repo's local logs
- tags: [project:calistenia, type:pain-frequency-guardrail, criterion:health-recommendations-cheatsheet]

### T-042.2 - Add post-lunch energy action guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates the health-system breakfast-protein → post-lunch-fatigue correlation into a practical action and desk-mobility choice
- source: `T-042; health-system/logic/correlations.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-15: published `energia-post-almuerzo.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow static translation: it tells Sebas to prioritize breakfast protein for the detected pattern and routes the current movement break to the existing desk-mobility routine; no health-system logs are read at runtime
- tags: [project:calistenia, type:post-lunch-energy-correlation, criterion:health-recommendations-cheatsheet]

### T-042.3 - Add post-workout recovery reset
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's post-workout water + protein reminder into an immediate recovery action
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-16: published `recuperacion-post-entreno.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow static translation of health-system’s post-workout “2 vasos de agua + proteína” calendar reminder; manual trigger only, with no runtime calendar/log access or nutrition prescription
  - distinct from pain-frequency training guardrail and breakfast-protein/post-lunch-fatigue correlation
- tags: [project:calistenia, type:post-workout-recovery-reset, criterion:health-recommendations-cheatsheet]

### T-042.4 - Add post-meeting mobility reset
- status: `done`
- goal: add a calistenia cheat-sheet page that translates the health-system meeting-end movement-break and long-meeting water rules into a practical desk-mobility reset
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-17: published `reset-post-reunion.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow static translation: after a meeting, do 2 minutes of existing desk mobility; meetings over 1 hour add a glass of water; no runtime calendar or log access
  - distinct from pain-frequency, breakfast/post-lunch fatigue, and post-workout recovery guides
- tags: [project:calistenia, type:post-meeting-mobility-reset, criterion:health-recommendations-cheatsheet]

### T-042.5 - Add sleep screen-cutoff guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's non-cancelable 22:30 screen cutoff into a manual sleep-transition action
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-18: published `corte-pantallas.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow static translation of the health-system 22:30 screen cutoff; manual trigger only, with no runtime calendar, screen-use, or log access
  - distinct from pain-frequency, post-lunch energy, post-workout recovery, and post-meeting mobility guides
- tags: [project:calistenia, type:sleep-screen-cutoff, criterion:health-recommendations-cheatsheet]
