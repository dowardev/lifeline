import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TaskItem {
  id: number
  user_id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority?: number
  due_date?: string
  subtasks?: unknown
  order?: number
  checked: boolean
  name: string
  kanban: {
    columnName: 'pending' | 'progress' | 'finalized'
    position: number
  }
  guests?: Array<{ email: string }>
  reminders?: {
    start: Date
    end: Date
    notifications: string[]
    repeat: {
      frecuency: number
      type: 'daily' | 'weekly' | 'monthly' | 'annually'
      daysWeek?: string[]
    }
  }
  timezone?: string
}

function mapTaskToItem(raw: unknown): TaskItem {
  const r = raw as Record<string, unknown>
  const statusToColumn: Record<string, 'pending' | 'progress' | 'finalized'> = {
    pending: 'pending',
    in_progress: 'progress',
    completed: 'finalized',
  }
  const status = (r.status as string) || 'pending'
  return {
    ...r as Partial<TaskItem>,
    title: (r.title as string) ?? (r.name as string) ?? '',
    name: (r.title as string) ?? (r.name as string) ?? '',
    checked: status === 'completed',
    kanban: {
      columnName: statusToColumn[status] ?? ('pending' as const),
      position: (r.order as number) ?? 0,
    },
  } as TaskItem
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<TaskItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setTasks(params: { tasks: TaskItem[] }) {
    tasks.value = params.tasks.map(mapTaskToItem)
  }

  function addTask(params: { task: TaskItem }) {
    tasks.value.push(mapTaskToItem(params.task))
  }

  function updateTask(params: { id: number; updates: Partial<TaskItem> }) {
    const { id, updates } = params
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      const merged = { ...tasks.value[index], ...updates }
      tasks.value[index] = mapTaskToItem(merged)
    }
  }

  function removeTask(params: { id: number }) {
    tasks.value = tasks.value.filter((t) => t.id !== params.id)
  }

  function setLoading(params: { loading: boolean }) {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }) {
    error.value = params.error
  }

  function clearError() {
    error.value = null
  }

  return { tasks, loading, error, setTasks, addTask, updateTask, removeTask, setLoading, setError, clearError }
})
