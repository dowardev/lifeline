import { defineStore } from "pinia";
import { Document } from "../utils/interfaces";

interface DocumentState {
  documents: Array<Document>;
}

export const useDocumentStore = defineStore("document", {
  state: (): DocumentState => ({
    documents: [],
  }),

  getters: {
    getDocuments(state) {
      return () => {
        return state.documents;
      };
    },

    getDocument(state) {
      return (params: { documentId: string }) => {
        const id = params.documentId;
        let document = state.documents.filter((element) => {
          return element.id == id;
        });

        document = JSON.parse(JSON.stringify(document))[0];
        return document;
      };
    },
  },

  actions: {
    addDocument(params: { document: Document }) {
      const document = params.document;

      if (this.documents.length == 0) this.documents = [document];
      else {
        let exists = false as boolean;
        this.documents.forEach((element) => {
          if (element.id == document.id) exists = true;
        });

        if (exists == false) this.documents.push(document);
      }
    },

    updateDocument(params: { document: Document }) {
      const document = params.document;
      console.log(document);

      this.documents = this.documents.map((element) => {
        if (element.id == document.id) element = { ...element, ...document };
        return element;
      });
    },

    removeDocument(params: { documentId: string }) {
      const id = params.documentId;
      const index = this.documents.findIndex((element) => element.id == id);
      if (index != undefined) this.documents?.splice(index, 1);
    },
  },
});
