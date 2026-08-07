import { useEffect, useMemo, useState } from 'react'
import * as repo from '../services/repository.js'

/**
 * Owns the teacher roster for the Teachers page, backed by the shared
 * data repository (mock cache / Supabase) with local search filtering.
 */
export function useTeachers() {
  const [teachers, setTeachers] = useState(() => repo.listTeachers())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repo.hydrateAll()
        if (active) setTeachers(repo.listTeachers())
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

  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        searchTerm.trim() === '' ||
        teacher.name.includes(searchTerm) ||
        teacher.subject.includes(searchTerm)
    )
  }, [teachers, searchTerm])

  async function addTeacher(formValues) {
    const created = await repo.createTeacher(formValues)
    await repo.loadTeachers()
    setTeachers(repo.listTeachers())
    return created
  }

  async function editTeacher(teacherId, formValues) {
    await repo.updateTeacher(teacherId, formValues)
    await repo.loadTeachers()
    setTeachers(repo.listTeachers())
  }

  async function removeTeacher(teacherId) {
    await repo.deleteTeacher(teacherId)
    await repo.loadTeachers()
    setTeachers(repo.listTeachers())
  }

  return {
    teachers: filteredTeachers,
    totalCount: teachers.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    addTeacher,
    updateTeacher: editTeacher,
    deleteTeacher: removeTeacher,
  }
}