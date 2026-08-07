import { useEffect, useMemo, useState } from 'react'
import * as repo from '../services/repository.js'
import { useStudents } from './useStudents.js'
import { useExams } from './useExams.js'

/**
 * Owns the classes (الصفوف) roster for the admin Classes page, backed by the
 * repository. Live student/exam counts are computed from the real rosters.
 */
export function useClasses() {
  const [classes, setClasses] = useState(() => repo.listClasses())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('All')

  const { students } = useStudents()
  const { exams } = useExams()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repo.hydrateAll()
        if (active) setClasses(repo.listClasses())
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const enriched = useMemo(() => {
    return classes.map((cls) => ({
      ...cls,
      // Real counts computed from the live rosters — never fall back to the
      // stored `students_count`/`exams_count` columns (they are seeded values
      // and are not kept in sync when students/exams change).
      studentsCount: students.filter((s) => s.grade === cls.name && s.stage === cls.stage).length,
      examsCount: exams.filter((e) => e.grade === cls.name && e.stage === cls.stage).length,
    }))
  }, [classes, students, exams])

  const filtered = useMemo(() => {
    return enriched.filter((cls) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        cls.name.includes(searchTerm) ||
        cls.stage.includes(searchTerm)
      const matchesStage = stageFilter === 'All' || cls.stage === stageFilter
      return matchesSearch && matchesStage
    })
  }, [enriched, searchTerm, stageFilter])

  async function addClass(formData) {
    await repo.createClass(formData)
    setClasses(repo.listClasses())
  }

  async function editClass(id, formData) {
    await repo.updateClass(id, formData)
    setClasses(repo.listClasses())
  }

  async function removeClass(id) {
    await repo.deleteClass(id)
    setClasses(repo.listClasses())
  }

  return {
    classes: filtered,
    totalCount: enriched.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
    addClass,
    updateClass: editClass,
    deleteClass: removeClass,
  }
}