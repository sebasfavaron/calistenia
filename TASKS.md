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
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates the health-system breakfast-protein → post-lunch-fatigue correlation into a practical action and desk-mobility choice
- source: `T-042; health-system/logic/correlations.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:post-lunch-energy-correlation, criterion:health-recommendations-cheatsheet]

### T-042.3 - Add post-workout recovery reset
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's post-workout water + protein reminder into an immediate recovery action
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:post-workout-recovery-reset, criterion:health-recommendations-cheatsheet]

### T-042.4 - Add post-meeting mobility reset
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates the health-system meeting-end movement-break and long-meeting water rules into a practical desk-mobility reset
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:post-meeting-mobility-reset, criterion:health-recommendations-cheatsheet]

### T-042.5 - Add sleep screen-cutoff guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's non-cancelable 22:30 screen cutoff into a manual sleep-transition action
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:sleep-screen-cutoff, criterion:health-recommendations-cheatsheet]

### T-042.6 - Add resting-heart-rate training-rest guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's sustained elevated resting-heart-rate escalation into a manual rest-or-walk decision before training
- source: `T-042; health-system/logic/escalation_rules.md; health-system/config/health_config.yaml; health-system/config/xiaomi_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:resting-heart-rate-training-rest, criterion:health-recommendations-cheatsheet]

### T-042.7 - Add deep-work movement-break guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's 90-minute deep-work movement-break rule into a manual desk-mobility reset
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:deep-work-movement-break, criterion:health-recommendations-cheatsheet]


### T-042.8 - Add afternoon hydration catch-up guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's after-16:00 low-water escalation into a manual hydration catch-up action
- source: `T-042; health-system/logic/escalation_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:afternoon-hydration-catchup, criterion:health-recommendations-cheatsheet]

### T-042.9 - Add knee-pain movement-break cadence guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's low-movement-breaks plus knee-pain rule into a manual desk-mobility cadence
- source: `T-042; health-system/logic/escalation_rules.md`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:knee-pain-movement-break-cadence, criterion:health-recommendations-cheatsheet]

### T-042.10 - Add breakfast-protein restart guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's two-consecutive-missed-breakfast-protein rule into a manual next-breakfast reset
- source: `T-042; health-system/logic/escalation_rules.md`
- workspace: `/home/sebas/work/projects/calistenia`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:breakfast-protein-restart, criterion:health-recommendations-cheatsheet]

### T-042.12 - Add pre-meal water guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's scheduled-meal pre-water reminder into one manual hydration action before lunch or dinner
- source: `T-042; health-system/config/calendar_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/tasks/T-042.12/`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:pre-meal-water, criterion:health-cheat-sheet]

### T-042.11 - Add severe hydration reset guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's two-consecutive-days severe low-water escalation into a manual hydration reset
- source: `T-042; health-system/logic/escalation_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/tasks/T-042.11/`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:severe-hydration-reset, criterion:health-cheat-sheet]

### T-042.13 - Add repeated screen-cutoff reset guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's fourth weekly screen-cutoff violation escalation into a manual no-postponement reset
- source: `T-042; health-system/logic/escalation_rules.md`
- workspace: `/home/sebas/work/tasks/T-042.13/`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:repeated-screen-cutoff-reset, criterion:health-cheat-sheet]

### T-042.14 - Add repeated knee-pain training-stop guide
- status: `removed`
- goal: add a calistenia cheat-sheet page that translates health-system's three weekly knee-pain escalation into a manual next-session stop and physiotherapy action
- source: `T-042; health-system/logic/escalation_rules.md; health-system/config/health_config.yaml`
- workspace: `/home/sebas/work/projects/calistenia/`
- next_step:
  - none; choose a different narrow criterion slice for the next T-042.x task
- notes:
  - removed 2026-07-24: page found impractical for daily use, cut per owner review; see T-032/project-criteria.md update for calistenia (no more one-off manual cheat-sheet pages).
- tags: [project:calistenia, type:repeated-knee-pain-training-stop, criterion:health-cheat-sheet]
