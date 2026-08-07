import { useEffect, useState } from 'react'
import * as repo from '../services/repository.js'

/**
 * Owns the subject list for the Subjects page, backed by the shared
 * data repository (mock cache / Supabase).
 */
export function useSubjects() {
  const [subjects, setSubjects] = useState(() => repo.listSubjects())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await repo.hydrateAll()
        if (active) setSubjects(repo.listSubjects())
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

  async function addSubject(name) {
    await repo.createSubject(name)
    setSubjects(repo.listSubjects())
  }

  async function editSubject(subjectId, name) {
    await repo.updateSubject(subjectId, name)
    setSubjects(repo.listSubjects())
  }

  async function removeSubject(subjectId) {
    await repo.deleteSubject(subjectId)
    setSubjects(repo.listSubjects())
  }

  return {
    subjects,
    totalCount: subjects.length,
    loading,
    error,
    addSubject,
    updateSubject: editSubject,
    deleteSubject: removeSubject,
  }
}