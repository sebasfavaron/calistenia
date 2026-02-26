export const GROUP_LABELS = {
  todos: 'Todos',
  push: 'Push',
  pull: 'Pull',
  piernas: 'Piernas',
  core: 'Core',
  movilidad: 'Movilidad',
};

export const EQUIPMENT_LABELS = {
  Band: 'Banda',
  Bodyweight: 'Peso corporal',
  Cardio: 'Cardio',
  Kettlebells: 'Kettlebells',
  TRX: 'TRX',
};

export const DIFFICULTY_LABELS = {
  Beginner: 'Principiante',
  Novice: 'Inicial',
  Intermediate: 'Intermedio',
  Advanced: 'Avanzado',
};

export const MUSCLE_LABELS = {
  Abdominals: 'Abdominales',
  'Anterior Deltoid': 'Deltoide anterior',
  Biceps: 'Biceps',
  Calves: 'Pantorrillas',
  Chest: 'Pecho',
  Feet: 'Pies',
  Forearms: 'Antebrazos',
  'Front Shoulders': 'Hombros frontales',
  Glutes: 'Gluteos',
  Hamstrings: 'Isquiotibiales',
  'Inner Thigh': 'Aductores',
  'Lateral Deltoid': 'Deltoide lateral',
  Lats: 'Dorsales',
  'Lower Traps': 'Trapecios inferiores',
  'Lower back': 'Zona lumbar',
  Neck: 'Cuello',
  Obliques: 'Oblicuos',
  'Posterior Deltoid': 'Deltoide posterior',
  Quads: 'Cuadriceps',
  'Rectus Femoris': 'Recto femoral',
  Shoulders: 'Hombros',
  Tibialis: 'Tibial anterior',
  Traps: 'Trapecios',
  'Traps (mid-back)': 'Trapecios (espalda media)',
  Triceps: 'Triceps',
  'Upper Traps': 'Trapecios superiores',
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
    muscles: sortWithTodos(muscles, (v) => localizeTaxonomyValue('muscle', v)),
    equipment: sortWithTodos(equipment, (v) => localizeTaxonomyValue('equipment', v)),
    difficulties: sortWithTodos(difficulties, (v) => localizeTaxonomyValue('difficulty', v)),
  };
}

export function localizeTaxonomyValue(key, value) {
  if (value == null) return '';
  if (value === 'todos') return 'Todos';
  if (key === 'group') return GROUP_LABELS[value] ?? value;
  if (key === 'muscle') return MUSCLE_LABELS[value] ?? value;
  if (key === 'equipment') return EQUIPMENT_LABELS[value] ?? value;
  if (key === 'difficulty') return DIFFICULTY_LABELS[value] ?? value;
  return value;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sortWithTodos(values, labelFn = (v) => v) {
  const rest = values.filter((v) => v !== 'todos').sort((a, b) => labelFn(a).localeCompare(labelFn(b), 'es', { sensitivity: 'base' }));
  return values.includes('todos') ? ['todos', ...rest] : rest;
}
