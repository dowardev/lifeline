import { NewTask, Task } from "@/utils/interfaces";
import { useTasksStore } from "../store/tasksStore";
import { storage } from "@/main";

export class TaskController {
  taskStore = useTasksStore();

  async saveTask(params: { task: NewTask }): Promise<{ id: string }> {
    const taskData = params.task;
    let task = {} as Task;

    try {
      let task = {} as Task;
      const id = Date.now().toString();

      (taskData as Task).id = "";
      task = taskData as Task;
      task.id = id;

      const tasks =
        (await this.getTasks2()) != null ? await this.getTasks2() : [];
      tasks?.push(taskData as Task);
      await storage.set("tasks", tasks);

      this.taskStore.addTask({ task });

      return { id: task.id };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async updateTask(params: { task: Task }): Promise<void> {
    const taskData = params.task;

    try {
      let tasks = (await this.getTasks2()) ?? [];
      tasks = tasks?.map((task) => {
        if (task.id == taskData.id) task = taskData;
        return task;
      });
      await storage.set("tasks", tasks);
      this.taskStore.updateTask({ task: taskData });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async loadTasks(): Promise<void> {
    const tasks = (await this.getTasks2()) ?? [];
    this.taskStore.updateTasks({ tasks });
  }

  getTasks(): Array<Task> | undefined {
    const tasks = this.taskStore.getTasks();

    return tasks != null ? JSON.parse(JSON.stringify(tasks)) : undefined;
  }

  getTask(params: { idTask: string }): Task | undefined {
    const idTask = params.idTask;
    const task = this.taskStore.getTask({ idTask });

    return task != null ? JSON.parse(JSON.stringify(task)) : undefined;
  }

  async deleteTask(params: { taskId: string }): Promise<void> {
    const taskId = params.taskId;
    const tasks = (await this.getTasks2()) ?? [];

    const index = tasks?.findIndex((element) => element.id == id);
    if (index != undefined) {
      tasks?.splice(index, 1);
      await storage.set("tasks", tasks);
    }
    this.taskStore.removeTask({ taskId });
  }

  async getTaskLocal(id: number): Promise<any[]> {
    const tasks = await storage.get("tasks");

    const task = (JSON.parse(tasks) as Array<any>).filter(
      (element) => parseInt(element["id" as any]) == id,
    );

    return task;
  }

  async getTasks2(): Promise<Array<Task> | null> {
    return await storage.get("tasks");
  }
}
