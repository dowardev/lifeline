import { taskService } from '@/services/taskService'
import { useTaskStore } from '@/store/taskStore'
import { db } from '@/db'
import type { TaskItem } from '@/store/taskStore'

export class TaskController {
  private get store() {
    return useTaskStore()
  }

  async loadTasks() {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const localTasks = await db.tasks.toArray()
      this.store.setTasks({ tasks: localTasks as unknown as TaskItem[] })
      try {
        const response = await taskService.getTasks()
        const serverTasks = Array.isArray(response.tasks) ? response.tasks : Array.isArray(response) ? response : []
        this.store.setTasks({ tasks: serverTasks })
        await db.tasks.bulkPut(serverTasks)
      } catch (error) {
        console.error('[TaskController.loadTasks]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async createTask(params: {
    title: string
    description?: string
    status?: string
    priority?: number
    due_date?: string
    subtasks?: string
  }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const localId = Date.now() + Math.floor(Math.random() * 100000)
      const safeStatus = (params.status || 'pending') as 'pending' | 'in_progress' | 'completed'
      const tempTask = {
        id: localId,
        user_id: 0,
        title: params.title,
        description: params.description,
        status: safeStatus,
        priority: params.priority,
        due_date: params.due_date,
        subtasks: params.subtasks,
      }
      this.store.addTask({ task: tempTask as unknown as TaskItem })
      await db.tasks.put(tempTask)
      try {
        const response = await taskService.createTask(params)
        const serverTask = response.task || response
        this.store.updateTask({ id: localId, updates: serverTask })
        await db.tasks.delete(localId)
        await db.tasks.put(serverTask)
      } catch (error) {
        console.error('[TaskController.createTask]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateTask(params: { id?: number; task?: any; title?: string; description?: string; status?: string; priority?: number; due_date?: string; order?: number }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const data = params.task || params
      const taskId = params.id ?? data.id
      this.store.updateTask({ id: taskId, updates: data })
      await db.tasks.update(taskId, data)
      try {
        await taskService.updateTask(data)
      } catch (error) {
        console.error('[TaskController.updateTask]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteTask(params: { id: number }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      this.store.removeTask({ id: params.id })
      await db.tasks.delete(params.id)
      try {
        await taskService.deleteTask({ id: params.id })
      } catch (error) {
        console.error('[TaskController.deleteTask]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  getTasks(): TaskItem[] {
    return this.store.tasks
  }

  getTask(params: { id: number | string }): TaskItem | null {
    const id = Number(params.id)
    return this.store.tasks.find((t) => t.id === id) || null
  }

  async updateTaskStatus(params: { id: number | string; status: string }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const id = Number(params.id)
      const safeStatus = params.status as 'pending' | 'in_progress' | 'completed'
      this.store.updateTask({ id, updates: { status: safeStatus } })
      await db.tasks.update(id, { status: safeStatus })
      try {
        await taskService.updateTask({ id, status: params.status })
      } catch (error) {
        console.error('[TaskController.updateTaskStatus]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }
}
