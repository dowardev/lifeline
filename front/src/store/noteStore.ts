import { defineStore } from "pinia";
import { Note } from "../utils/interfaces";

interface NoteState {
  notes: Array<Note>;
}

export const useNoteStore = defineStore("note", {
  state: (): NoteState => ({
    notes: [],
  }),

  getters: {
    getNotes(state) {
      return () => {
        return state.notes;
      };
    },
  },

  actions: {
    addNote(params: { note: Note }) {
      const bite = params.note;

      if (this.notes.length == 0) this.notes = [bite];
      else {
        let exists = false as boolean;
        this.notes.forEach((element) => {
          if (element.id == bite.id) exists = true;
        });

        if (exists == false) this.notes.push(bite);
      }
    },

    updateNote(params: { document: Note }) {
      const document = params.document;

      this.notes = this.notes.map((element) => {
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
