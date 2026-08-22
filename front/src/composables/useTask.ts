// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { TaskController } from '@/controllers/taskController'

export function useTask(): {
  loadTasks: TaskController['loadTasks']
  createTask: TaskController['createTask']
  updateTask: TaskController['updateTask']
  deleteTask: TaskController['deleteTask']
  getTasks: TaskController['getTasks']
  getTask: TaskController['getTask']
  updateTaskStatus: TaskController['updateTaskStatus']
} {
  const controller = new TaskController()
  return {
    loadTasks: controller.loadTasks.bind(controller),
    createTask: controller.createTask.bind(controller),
    updateTask: controller.updateTask.bind(controller),
    deleteTask: controller.deleteTask.bind(controller),
    getTasks: controller.getTasks.bind(controller),
    getTask: controller.getTask.bind(controller),
    updateTaskStatus: controller.updateTaskStatus.bind(controller),
  }
}
