import { NewTask, Task } from "@/utils/interfaces";
import { useTasksStore } from "../store/tasksStore";
import { TaskService } from "@/services/task";

export class TaskController {
  taskStore = useTasksStore();
  taskService = new TaskService();

  async saveTask(params: { task: NewTask }): Promise<{ id: string }> {
    const taskData = params.task;
    let task = {} as Task;

    try {
      task = (
        await this.taskService.saveLocalTask({
          task: taskData,
        })
      ).task;
      this.taskStore.addTask({ task });

      return { id: task.id };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async updateTask(params: { task: Task }): Promise<void> {
    const taskData = params.task;

    try {
      await this.taskService.updateLocalTask({
        task: taskData,
      });
      this.taskStore.updateTask({ task: taskData });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async loadTasks(): Promise<void> {
    const tasks = (await this.taskService.getTasks()) ?? [];
    this.taskStore.updateTasks({ tasks });
  }

  getTasks(): Array<Task> | undefined {
    const tasks = this.taskStore.getTasks();

    return tasks != null ? JSON.parse(JSON.stringify(tasks)) : undefined;
  }

  getTask(params: { idTask: string }): Task | undefined {
    const idTask = params.idTask;
    const task = taskStore.getTask({ idTask });

    return task != null ? JSON.parse(JSON.stringify(task)) : undefined;
  }

  async deleteTask(params: { taskId: string }) {
    const taskId = params.taskId;
    await this.taskService.deleteTask({ taskId });
    this.taskStore.removeTask({ taskId });
  }
}
