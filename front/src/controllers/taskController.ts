// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { taskService } from "@/services/taskService";
import { useTaskStore } from "@/store/taskStore";
import { db } from "@/db";
import type { TaskRecord } from "@/db/schema";
import type { TaskItem } from "@/store/taskStore";

export class TaskController {
  private get store(): ReturnType<typeof useTaskStore> {
    return useTaskStore();
  }

  async loadTasks(): Promise<void> {
    this.store.setLoading({ loading: true });
    this.store.clearError();
    try {
      const localTasks = await db.tasks.toArray();
      this.store.setTasks({ tasks: localTasks as unknown as TaskItem[] });
      try {
        const response = await taskService.getTasks();
        const serverTasks = Array.isArray(response.tasks)
          ? response.tasks
          : Array.isArray(response)
            ? response
            : [];
        this.store.setTasks({ tasks: serverTasks });
        await db.tasks.bulkPut(serverTasks);
      } catch (error) {
        console.error("[TaskController.loadTasks]", error);
        this.store.setError({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.store.setLoading({ loading: false });
    }
  }

  async createTask(params: {
    title: string;
    description?: string;
    status?: string;
    priority?: number;
    due_date?: string;
    subtasks?: string;
    notifications?: string[];
    id_reminders?: number[];
  }): Promise<TaskItem> {
    this.store.setLoading({ loading: true });
    this.store.clearError();
    try {
      const response = await taskService.createTask(params);
      const serverTask = response.task || response;
      this.store.addTask({ task: serverTask });
      await db.tasks.put(serverTask);
      return serverTask;
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.store.setLoading({ loading: false });
    }
  }

  async updateTask(params: {
    id?: number;
    task?: any;
    title?: string;
    description?: string;
    status?: string;
    priority?: number;
    due_date?: string;
    order?: number;
    notifications?: string[];
    id_reminders?: number[];
  }): Promise<void> {
    this.store.setLoading({ loading: true });
    this.store.clearError();
    try {
      const data = params.task || params;
      const taskId = params.id ?? data.id;
      if (taskId < 0) {
        // local-only task: skip server, just update local stores
        this.store.updateTask({ id: taskId, updates: data });
        await db.tasks.update(taskId, data);
      } else {
        await taskService.updateTask(data);
        this.store.updateTask({ id: taskId, updates: data });
        await db.tasks.update(taskId, data);
      }
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.store.setLoading({ loading: false });
    }
  }

  async addLocalTask(params: { task: TaskItem }): Promise<void> {
    this.store.addTask({ task: params.task });
    const record: TaskRecord = {
      id: params.task.id,
      user_id: params.task.user_id,
      title: params.task.title,
      description: params.task.description,
      status: params.task.status,
      priority: params.task.priority,
      due_date: params.task.due_date,
      subtasks: typeof params.task.subtasks === 'string' ? params.task.subtasks : '',
      order: params.task.order,
      notifications: params.task.notifications,
      id_reminders: params.task.id_reminders,
    };
    await db.tasks.put(record);
  }

  async deleteTask(params: { id: number }): Promise<void> {
    this.store.setLoading({ loading: true });
    this.store.clearError();
    try {
      if (params.id < 0) {
        this.store.removeTask({ id: params.id });
        await db.tasks.delete(params.id);
      } else {
        await taskService.deleteTask({ id: params.id });
        this.store.removeTask({ id: params.id });
        await db.tasks.delete(params.id);
      }
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.store.setLoading({ loading: false });
    }
  }

  getTasks(): TaskItem[] {
    return this.store.tasks;
  }

  getTask(params: { id: number | string }): TaskItem | null {
    const id = Number(params.id);
    return this.store.tasks.find((t) => t.id === id) || null;
  }

  async updateTaskStatus(params: {
    id: number | string;
    status: string;
  }): Promise<void> {
    this.store.setLoading({ loading: true });
    this.store.clearError();
    try {
      const id = Number(params.id);
      await taskService.updateTask({ id, status: params.status });
      const safeStatus = params.status as
        "pending" | "in_progress" | "completed";
      this.store.updateTask({ id, updates: { status: safeStatus } });
      await db.tasks.update(id, { status: safeStatus });
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.store.setLoading({ loading: false });
    }
  }
}
