import { useEffect, useMemo, useState } from 'react'
import * as repo from '../services/repository.js'

/**
 * Owns the results (exam attempts) for the teacher Results page: hydrated
 * from Supabase when live, cached-backed otherwise, with search + pass
 * filtering.
 */
export function useExamAttempts() {
  const [attempts, setAttempts] = useState(() => repo.listExamAttempts())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repo.hydrateAll()
        if (active) setAttempts(repo.listExamAttempts())
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
  // so the results update live without a page refresh.
  useEffect(() => {
    return repo.subscribeToCache(() => {
      setAttempts(repo.listExamAttempts())
    })
  }, [])

  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        attempt.studentName.includes(searchTerm) ||
        attempt.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.examName.includes(searchTerm)

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Passed' && attempt.passed) ||
        (statusFilter === 'Failed' && !attempt.passed)

      return matchesSearch && matchesStatus
    })
  }, [attempts, searchTerm, statusFilter])

  async function recordAttempt(attempt) {
    const created = await repo.createExamAttempt(attempt)
    setAttempts(repo.listExamAttempts())
    return created
  }

  async function removeAttempt(attemptId) {
    await repo.deleteExamAttempt(attemptId)
    setAttempts(repo.listExamAttempts())
  }

  return {
    attempts: filteredAttempts,
    totalCount: attempts.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    recordAttempt,
    deleteAttempt: removeAttempt,
  }
}