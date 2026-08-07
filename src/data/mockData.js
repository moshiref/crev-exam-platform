// ============================================================================
// Educational configuration is the ONLY data in this file.
// These are constants that describe the platform (stages, grades, status
// labels) — NOT fake records. There are no demo students/teachers/exams/
// results here; the demo dataset is built on demand by `data/demoData.js`
// and only introduced when the admin clicks "Load demo data".
// ============================================================================

export const EDUCATIONAL_STAGES = ['ابتدائي', 'إعدادي', 'ثانوي']

export const GRADES_BY_STAGE = {
  'ابتدائي': ['الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'],
  'إعدادي': ['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي'],
  'ثانوي': ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'],
}

export const EXAM_STATUSES = {
  Published: 'منشور',
  Draft: 'مسودة',
}