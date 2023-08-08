import { format } from "date-fns";
import { storage } from "@/main";

import apolloClient from "../Apollo";
import { provideApolloClient } from "@vue/apollo-composable";
provideApolloClient(apolloClient);

import { Task, NewTask } from "@/utils/interfaces";

export async function getTaskLocal(id: number) {
  const tasks = await storage.get("tasks");

  const task = (JSON.parse(tasks) as Array<any>).filter(
    (element) => parseInt(element["id" as any]) == id
  );

  return task;
}

export async function saveLocalTask(params: {
  task: NewTask;
}): Promise<{ task: Task }> {
  const taskData = params.task;
  let task = {} as Task;
  const id = Date.now().toString();

  (taskData as Task).id = "";
  task = taskData as Task;
  task.id = id;

  const tasks = (await getTasks()) != null ? await getTasks() : [];
  tasks?.push(taskData as Task);
  await storage.set("tasks", tasks);

  return { task: taskData as Task };
}

export async function updateLocalTask(params: { task: Task }): Promise<void> {
  const taskData = params.task;
  let tasks = (await getTasks()) ?? [];
  tasks = tasks?.map((task) => {
    if (task.id == taskData.id) task = taskData;
    return task;
  });
  await storage.set("tasks", tasks);
}

export async function getTasks(): Promise<Array<Task> | null> {
  return await storage.get("tasks");
}

export async function getTask(params: { id: string }): Promise<Task | null> {
  const id = params.id;
  const task = (await storage.get("tasks")).filter((task: Task) => task.id == id);
  return task[0];
}

export async function deleteTask(params: { taskId: string }): Promise<void> {
  const id = params.taskId;
  const tasks = (await getTasks()) ?? [];

  const index = tasks?.findIndex((element) => element.id == id);
  if (index != undefined) {
    tasks?.splice(index, 1);
    await storage.set("tasks", tasks);
  }
}
