export const GROUP_LABELS = {
  todos: 'Todos',
  push: 'Push',
  pull: 'Pull',
  piernas: 'Piernas',
  core: 'Core',
  movilidad: 'Movilidad',
};

export const FILTER_CONFIG = [
  { key: 'group', label: 'Grupo' },
  { key: 'muscle', label: 'Musculo' },
  { key: 'equipment', label: 'Equipo' },
  { key: 'difficulty', label: 'Dificultad' },
];

export function normalizeFilterValues(manifest) {
  const exercises = Array.isArray(manifest?.exercises) ? manifest.exercises : [];
  const fromManifest = manifest?.filters ?? {};

  const groups = unique(['todos', ...(fromManifest.groups ?? []), ...exercises.map((e) => e.group).filter(Boolean)]);
  const muscles = unique(['todos', ...(fromManifest.muscles ?? []), ...exercises.map((e) => e.muscle).filter(Boolean)]);
  const equipment = unique(['todos', ...(fromManifest.equipment ?? []), ...exercises.map((e) => e.equipment).filter(Boolean)]);
  const difficulties = unique(['todos', ...(fromManifest.difficulties ?? []), ...exercises.map((e) => e.difficulty).filter(Boolean)]);

  return {
    groups: sortWithTodos(groups, (v) => GROUP_LABELS[v] ?? v),
    muscles: sortWithTodos(muscles),
    equipment: sortWithTodos(equipment),
    difficulties: sortWithTodos(difficulties),
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sortWithTodos(values, labelFn = (v) => v) {
  const rest = values.filter((v) => v !== 'todos').sort((a, b) => labelFn(a).localeCompare(labelFn(b), 'es', { sensitivity: 'base' }));
  return values.includes('todos') ? ['todos', ...rest] : rest;
}
