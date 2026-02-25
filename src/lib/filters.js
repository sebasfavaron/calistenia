export const defaultFilters = {
  group: ['todos'],
  muscle: ['todos'],
  equipment: ['todos'],
  difficulty: ['todos'],
};

export function matchesFilters(ex, filters) {
  return (
    matchOne(ex.group, filters.group) &&
    matchOne(ex.muscle, filters.muscle) &&
    matchOne(ex.equipment, filters.equipment) &&
    matchOne(ex.difficulty, filters.difficulty)
  );
}

function matchOne(value, selected) {
  const selectedValues = Array.isArray(selected) ? selected : [selected ?? 'todos'];
  return selectedValues.includes('todos') || selectedValues.includes(value);
}
