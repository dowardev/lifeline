import { defineStore } from "pinia";
import { Task } from "@/utils/interfaces";

interface TasksState {
  tasks: Task[];
}

export const useTasksStore = defineStore("tasks", {
  state: (): TasksState => ({
    tasks: [] as Task[],
  }),

  getters: {
    getTasks(state) {
      return () => {
        return state.tasks;
      };
    },

    getTask(state) {
      return (params: { idTask: string }) => {
        const idTask = params.idTask;
        const task = state.tasks.filter((task) => {
          if (task.id == idTask) return task;
        });
        return task[0];
      };
    },
  },

  actions: {
    addTask(params: { task: Task }) {
      this.tasks.push(params.task);
    },

    updateTask(params: { task: Task }) {
      const task = params.task;
      this.tasks = this.tasks.map((element) => {
        if (element.id == task.id) element = { ...element, ...task };
        return element;
      });
    },

    updateTasks(params: { tasks: Array<Task> }) {
      const tasks = params.tasks;
      const combinedArray: Task[] = [...tasks];

      this.tasks.forEach((item) => {
        const index = combinedArray.findIndex(
          (element) => element.id === item.id
        );
        if (index === -1) {
          combinedArray.push(item);
        } else {
          combinedArray[index] = item;
        }
      });

      this.tasks = combinedArray;
    },

    removeTask(params: { taskId: string }) {
      const id = params.taskId;
      const index = this.tasks.findIndex((element) => element.id == id);
      if (index != undefined) this.tasks?.splice(index, 1);
    },
  },
});
