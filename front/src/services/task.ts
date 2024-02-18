import { format } from "date-fns";
import { storage } from "@/main";

import apolloClient from "../Apollo";
import { provideApolloClient } from "@vue/apollo-composable";
provideApolloClient(apolloClient);

import { Task, NewTask } from "@/utils/interfaces";

export class TaskService {
  async getTaskLocal(id: number) {
    const tasks = await storage.get("tasks");

    const task = (JSON.parse(tasks) as Array<any>).filter(
      (element) => parseInt(element["id" as any]) == id
    );

    return task;
  }

  async saveLocalTask(params: { task: NewTask }): Promise<{ task: Task }> {
    const taskData = params.task;
    let task = {} as Task;
    const id = Date.now().toString();

    (taskData as Task).id = "";
    task = taskData as Task;
    task.id = id;

    const tasks = (await this.getTasks()) != null ? await this.getTasks() : [];
    tasks?.push(taskData as Task);
    await storage.set("tasks", tasks);

    return { task: taskData as Task };
  }

  async updateLocalTask(params: { task: Task }): Promise<void> {
    const taskData = params.task;
    let tasks = (await this.getTasks()) ?? [];
    tasks = tasks?.map((task) => {
      if (task.id == taskData.id) task = taskData;
      return task;
    });
    await storage.set("tasks", tasks);
  }

  async getTasks(): Promise<Array<Task> | null> {
    return await storage.get("tasks");
  }

  async getTask(params: { id: string }): Promise<Task | null> {
    const id = params.id;
    const task = (await storage.get("tasks")).filter(
      (task: Task) => task.id == id
    );
    return task[0];
  }

  async deleteTask(params: { taskId: string }): Promise<void> {
    const id = params.taskId;
    const tasks = (await this.getTasks()) ?? [];

    const index = tasks?.findIndex((element) => element.id == id);
    if (index != undefined) {
      tasks?.splice(index, 1);
      await storage.set("tasks", tasks);
    }
  }
}
