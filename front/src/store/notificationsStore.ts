import { defineStore } from "pinia";
import { Reminder } from "../utils/interfaces";

interface RreminderState {
  reminders: Array<Reminder>;
}

export const userReminderStore = defineStore("reminder", {
  state: (): RreminderState => ({
    reminders: [],
  }),

  getters: {
    getReminders(state) {
      return () => {
        return state.reminders;
      };
    },
  },

  actions: {
    addNotification(params: { reminder: Reminder }) {
      const reminder = params.reminder;

      if (this.reminders.length == 0) this.reminders = [reminder];
      else {
        let exists = false as boolean;
        this.reminders.forEach((element) => {
          if (element.id == reminder.id) exists = true;
        });

        if (exists == false) this.reminders.push(reminder);
      }
    },

    updateNote(params: { document: Reminder }) {
      const document = params.document;

      this.reminders = this.reminders.map((element) => {
        if (element.id == document.id) element = { ...element, ...document };
        return element;
      });
    },

    // removeNote(params: { id: string }) {
    //   const id = params.id;
    //   const index = this.documents.findIndex((element) => element.id == id);
    //   this.documents?.splice(index!, 1);
    // },
  },
});
