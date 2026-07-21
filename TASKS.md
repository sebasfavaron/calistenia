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

### T-042.6 - Add resting-heart-rate training-rest guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's sustained elevated resting-heart-rate escalation into a manual rest-or-walk decision before training
- source: `T-042; health-system/logic/escalation_rules.md; health-system/config/health_config.yaml; health-system/config/xiaomi_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-18: published `frecuencia-cardiaca-reposo.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow static translation: >70 bpm for 3 days means rest complete; >80 bpm for 5 days means no calisthenia, only walks and professional follow-up; manual trigger/count only, with no runtime watch or health-system access
  - distinct from pain-frequency, post-lunch energy, post-workout recovery, post-meeting mobility, and sleep screen-cutoff guides
- tags: [project:calistenia, type:resting-heart-rate-training-rest, criterion:health-recommendations-cheatsheet]

### T-042.7 - Add deep-work movement-break guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's 90-minute deep-work movement-break rule into a manual desk-mobility reset
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-19: published `pausa-deep-work.html`, linked it from every existing surface, and included it in the PWA shell
  - narrow static translation: deep work changes breaks to every 90 minutes; take a gentle 2-minute desk-mobility pause, manual trigger/count only, with no runtime calendar or health-system access
  - distinct from post-meeting mobility: it applies during solo focus blocks rather than at a meeting end
- tags: [project:calistenia, type:deep-work-movement-break, criterion:health-recommendations-cheatsheet]


### T-042.8 - Add afternoon hydration catch-up guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's after-16:00 low-water escalation into a manual hydration catch-up action
- source: `T-042; health-system/logic/escalation_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-20: published `rescate-hidratacion-tarde.html`, linked it from every existing surface, and included it in PWA shell v9
  - narrow static translation: after 16:00, fewer than 6 glasses means one glass now and a manual 30-minute reminder until 8; configured daily target remains 10; no runtime health-system, water-log, or notification access
  - evidence: `npm run build`; JS/service-worker syntax checks; every `dist/*.html` links the page; built preview returned HTTP 200 for page/index/service worker; `git diff --check`
- tags: [project:calistenia, type:afternoon-hydration-catchup, criterion:health-recommendations-cheatsheet]

### T-042.9 - Add knee-pain movement-break cadence guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's low-movement-breaks plus knee-pain rule into a manual desk-mobility cadence
- source: `T-042; health-system/logic/escalation_rules.md`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-20: published `pausas-dolor-rodilla.html`, linked it from every existing surface, and included it in PWA shell v10
  - narrow static translation: knee pain logged today plus fewer than 4 movement breaks changes remaining desk-mobility pauses to every 45 minutes; manual trigger/count only, with no runtime health-system, symptom-log, or timer access
  - distinct from the pain-frequency training guardrail: this addresses same-day desk-break cadence rather than pain recurrence or training volume
- tags: [project:calistenia, type:knee-pain-movement-break-cadence, criterion:health-recommendations-cheatsheet]

### T-042.10 - Add breakfast-protein restart guide
- status: `done`
- goal: add a calistenia cheat-sheet page that translates health-system's two-consecutive-missed-breakfast-protein rule into a manual next-breakfast reset
- source: `T-042; health-system/logic/escalation_rules.md`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - done 2026-07-21: published `reinicio-proteina-desayuno.html`, linked it from every existing surface, and included it in PWA shell v11
  - narrow static translation: after two consecutive breakfasts without protein, manually choose and prepare an option for tomorrow; no runtime health-system, meal-log, or notification access
  - distinct from the post-lunch energy correlation: this handles the two-day missed-input escalation before any fatigue outcome
- tags: [project:calistenia, type:breakfast-protein-restart, criterion:health-recommendations-cheatsheet]
