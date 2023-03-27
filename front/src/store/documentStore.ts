import { defineStore } from "pinia";
import { Document } from "../utils/interfaces";
import { DocumentElements } from "../utils/types";

interface DocumentState {
  documents: Array<Document>;
}

export const useDocumentStore = defineStore("document", {
  state: (): DocumentState => ({
    documents: Array<Document>(),
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
        const document = state.documents.filter((element) => {
          return element.id == id;
        });
        return document[0];
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

    removeElement(params: { index: number; documentId: string }) {
      const indexElement = params.index;
      const documentId = params.documentId;

      const indexDocument = this.documents.findIndex(
        (element) => element.id == documentId
      );

      if (indexDocument != undefined)
        this.documents[indexDocument].elements?.splice(indexElement, 1);
    },

    insertElement(params: { documentId: string; element: DocumentElements }) {
      const documentId = params.documentId;
      const element = params.element;

      const indexDocument = this.documents.findIndex(
        (element) => element.id == documentId
      );
      if (!this.documents[indexDocument].elements)
        this.documents[indexDocument].elements = [] as any;

      this.documents[indexDocument].elements?.push(element);
    },

    updateElements(params: {
      documentId: string;
      elements: Array<DocumentElements>;
    }) {
      const documentId = params.documentId;
      const elements = params.elements;

      const indexDocument = this.documents.findIndex(
        (element) => element.id == documentId
      );
      // if (!this.documents[indexDocument].elements)
      //   this.documents[indexDocument].elements = [] as any;

      console.log(elements)
      // this.documents[indexDocument].elements = elements as any;
    },
  },
});
