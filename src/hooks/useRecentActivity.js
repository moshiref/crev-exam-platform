import { useMemo } from 'react'
import { useStudents } from './useStudents.js'
import { useExams } from './useExams.js'
import { useExamAttempts } from './useExamAttempts.js'
import { computeRecentActivity, timeAgo } from '../utils/statsUtils.js'

/**
 * Derives the shared "recent activity" feed straight from the live dataset
 * (students, exams, attempts). Used by the admin Dashboard and the admin
 * Header notifications so both always reflect real data — never static text.
 */
export function useRecentActivity(limit = 6) {
  const { students } = useStudents()
  const { exams } = useExams()
  const { attempts } = useExamAttempts()

  return useMemo(() => {
    return computeRecentActivity({ students, exams, attempts }, limit).map((item) => ({
      ...item,
      time: timeAgo(item.date),
    }))
  }, [students, exams, attempts, limit])
}