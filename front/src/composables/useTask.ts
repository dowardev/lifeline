import { NewTask, Task } from "@/utils/interfaces";
import {
  saveLocalTask as saveLocalTaskService,
  getTasks as getTasksService,
  updateLocalTask,
  deleteTask as deleteTaskService,
} from "../services/task";
import { useTasksStore } from "../store/tasksStore";

export const useTask = () => {
  const taskStore = useTasksStore();

  async function saveTask(params: { task: NewTask }): Promise<{ id: string }> {
    const taskData = params.task;
    let task = {} as Task;

    try {
      task = (
        await saveLocalTaskService({
          task: taskData,
        })
      ).task;
      taskStore.addTask({ task });

      return { id: task.id };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function updateTask(params: { task: Task }): Promise<void> {
    const taskData = params.task;

    try {
      await updateLocalTask({
        task: taskData,
      });
      taskStore.updateTask({ task: taskData });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadTasks(): Promise<void> {
    const tasks = (await getTasksService()) ?? [];
    taskStore.updateTasks({ tasks });
  }

  function getTasks(): Array<Task> | undefined {
    const tasks = taskStore.getTasks();

    return tasks != null ? JSON.parse(JSON.stringify(tasks)) : undefined;
  }

  function getTask(params: { idTask: string }): Task | undefined {
    const idTask = params.idTask;
    const task = taskStore.getTask({ idTask });

    return task != null ? JSON.parse(JSON.stringify(task)) : undefined;
  }

  async function deleteTask(params: { taskId: string }) {
    const taskId = params.taskId;
    await deleteTaskService({ taskId });
    taskStore.removeTask({ taskId });
  }

  return {
    saveTask,
    loadTasks,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
  };
};
