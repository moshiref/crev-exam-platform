import { useEffect, useMemo, useState } from 'react'
import * as repo from '../services/repository.js'

/**
 * Owns the exam roster for the Exams page: synchronous cache-backed state,
 * async hydration from Supabase when live, and search/status filtering.
 *
 * When `options.ownerId` (a logged-in teacher + their `ownerSubject`) is given,
 * only exams owned by that teacher are exposed; otherwise (admin/demo) all
 * exams are returned. The question-building flow lives on the page itself and
 * hands this hook complete exam objects to persist.
 */
export function useExams({ ownerId = null, ownerSubject: _ownerSubject = null } = {}) {
  const scopeExams = (list) => {
    // A teacher owns exactly their exams — bound by `teacher_id`. We do NOT
    // filter by `subject`, otherwise exams a teacher created in any allowed
    // subject other than their primary one would be wrongly hidden.
    if (!ownerId) return list
    return list.filter((e) => e.teacherId === ownerId)
  }

  const [exams, setExams] = useState(() => scopeExams(repo.listExams()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repo.hydrateAll()
        if (active) setExams(scopeExams(repo.listExams()))
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to repository cache changes (same tab or mirrored from another tab)
  // so the roster updates live without a page refresh.
  useEffect(() => {
    return repo.subscribeToCache(() => {
      setExams(scopeExams(repo.listExams()))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        exam.name.includes(searchTerm) ||
        exam.subject.includes(searchTerm) ||
        exam.grade.includes(searchTerm)

      const matchesStatus = statusFilter === 'All' || exam.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [exams, searchTerm, statusFilter])

  async function addExam(examData) {
    /* eslint-disable-next-line no-console */
    console.log('[useExams.addExam] createExam called with:', examData)
    const created = await repo.createExam(examData)
    const list = scopeExams(repo.listExams())
    /* eslint-disable-next-line no-console */
    console.log('[useExams.addExam] returned id:', created?.id, '| teacher sees', list.length, 'of', repo.listExams().length, 'exams')
    setExams(list)
    return created
  }

  async function editExam(examId, examData) {
    await repo.updateExam(examId, examData)
    setExams(scopeExams(repo.listExams()))
  }

  async function removeExam(examId) {
    await repo.deleteExam(examId)
    setExams(scopeExams(repo.listExams()))
  }

  async function copyExam(examId) {
    await repo.duplicateExam(examId)
    setExams(scopeExams(repo.listExams()))
  }

  return {
    exams: filteredExams,
    totalCount: exams.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    addExam,
    updateExam: editExam,
    deleteExam: removeExam,
    duplicateExam: copyExam,
  }
}