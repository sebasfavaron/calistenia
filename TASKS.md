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
