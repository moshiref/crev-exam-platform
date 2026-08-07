import { useEffect, useMemo, useState } from 'react'
import * as repo from '../services/repository.js'

/**
 * Owns the student roster for the Students page: synchronous cache-backed
 * state, async hydration from Supabase when live, and search/filtering.
 *
 * Consumers keep working unchanged — only `loading` / `error` were added.
 */
export function useStudents() {
  const [students, setStudents] = useState(() => repo.listStudents())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repo.hydrateAll()
        if (active) setStudents(repo.listStudents())
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

  // React to repository cache changes (same tab or mirrored from another tab)
  // so the roster updates live without a page refresh.
  useEffect(() => {
    return repo.subscribeToCache(() => {
      setStudents(repo.listStudents())
    })
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        student.name.includes(searchTerm) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentPhone.includes(searchTerm)

      const matchesStatus = statusFilter === 'All' || student.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [students, searchTerm, statusFilter])

  /** Creates a student (auto id / password / PIN) and refreshes the list. */
  async function addStudent(formValues) {
    const created = await repo.createStudent(formValues)
    setStudents(repo.listStudents())
    return created
  }

  async function editStudent(studentId, formValues) {
    await repo.updateStudent(studentId, formValues)
    setStudents(repo.listStudents())
  }

  async function removeStudent(studentId) {
    await repo.deleteStudent(studentId)
    setStudents(repo.listStudents())
  }

  return {
    students: filteredStudents,
    totalCount: students.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    addStudent,
    updateStudent: editStudent,
    deleteStudent: removeStudent,
  }
}