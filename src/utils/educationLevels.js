// ============================================================================
// Educational levels — shared across the admin (teacher permissions) and the
// teacher exam builder so both sides agree on stage/grade options.
// ============================================================================

export const STAGES = ['ابتدائي', 'إعدادي', 'ثانوي']

export const GRADES_BY_STAGE = {
  'ابتدائي': ['الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'],
  'إعدادي': ['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي'],
  'ثانوي': ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'],
}

/** Flat list of every grade across all stages (used by the admin pickers). */
export const ALL_GRADES = Object.values(GRADES_BY_STAGE).flat()

/** Returns the stage a given grade belongs to, or empty string. */
export function stageOfGrade(grade) {
  const stage = Object.keys(GRADES_BY_STAGE).find((k) => GRADES_BY_STAGE[k].includes(grade))
  return stage || ''
}

/** Grades allowed for a set of selected stages. */
export function gradesOfStages(stages) {
  const list = stages || []
  return Object.keys(GRADES_BY_STAGE).reduce(
    (acc, stage) => (list.includes(stage) ? acc.concat(GRADES_BY_STAGE[stage]) : acc),
    []
  )
}