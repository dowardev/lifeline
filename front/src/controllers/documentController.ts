import {
  NewDocument,
  Document,
  DeleteDocument,
  Note,
} from "../utils/interfaces";
import { useDocumentStore } from "../store/this.documentStore";
import { DocumentElements } from "../utils/types";
import { format } from "date-fns";
import { LocalNotifications } from "@capacitor/local-notifications";
import { DocumentService } from "@/services/document";

export class DocumentController {
  documentStore = useDocumentStore();
  documentService = new DocumentService();

  async saveDocument(params: {
    document: { title: string };
  }): Promise<{ id: string; url: string } | null> {
    const documentData = params.document;
    let document = {} as Document;

    try {
      document = (
        await this.documentService.saveDocument({
          document: documentData,
        })
      ).document;
      this.documentStore.addDocument({ document });
      return { id: document.id, url: document.url };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async loadUserDocuments(): Promise<void> {
    const documents = await this.documentService.getUserDocuments();

    if (documents == null) return;

    documents.forEach((document) => {
      this.documentStore.addDocument({ document });
    });
  }

  async loadDocument(params: { elementId: string }): Promise<void> {
    const elementId = params.elementId;
    const document = await this.documentService.getDocument({
      elementId: elementId,
    });

    if (document == null) return;

    this.documentStore.addDocument({ document });
  }

  getUserDocuments(): Array<Document> | undefined {
    const documents = this.documentStore.getDocuments();
    return documents != null
      ? JSON.parse(JSON.stringify(documents))
      : undefined;
  }

  async deleteDocument(params: DeleteDocument): Promise<void> {
    const documentId = params.documentId;
    await this.documentService.deleteUserDocument({ documentId });
    this.documentStore.removeDocument({ documentId });
  }

  getUserDocument(params: {
    documentId?: string;
    documentUrl?: string;
  }): Document | undefined {
    const documentId = params.documentId;
    const documentUrl = params.documentUrl;

    let document = "" as any;
    if (documentId)
      document = this.documentStore.getDocument({ elementSearch: documentId });
    if (documentUrl)
      document = this.documentStore.getDocument({ elementSearch: documentUrl });

    return document ? document : undefined;
  }

  async updateDocument(params: { document: Document }): Promise<void> {
    try {
      const document = JSON.parse(JSON.stringify(params.document));
      await this.documentService.updateDocument({ document });
      this.documentStore.updateDocument({ document });
    } catch (error: any) {
      console.error(error);
    }
  }

  deleteElement(params: { index: number; documentId: string }) {
    const index = params.index;
    const documentId = params.documentId;

    this.documentStore.removeElement({ index, documentId });
  }

  insertElement(params: { documentId: string; element: DocumentElements }) {
    const documentId = params.documentId;
    const element = params.element;

    useDocumentStore().insertElement({ documentId, element });
  }

  async updateNoteValue(params: {
    data: { value: string };
    index: number;
    documentId: string;
  }) {
    const value = params.data.value;
    const index = params.index;
    const documentId = params.documentId;
    const document = await this.documentService.getDocument({
      elementId: documentId,
    });
    if (!document) return;

    const note = document?.elements![index].data as Note;
    note.content = value;
    await this.documentService.updateDocument({ document });

    if (!document?.elements) return;
    (document.elements[index].data as Note).content = value;
    await this.documentService.updateDocument({ document });
  }

  async updateNoteReminder(params: {
    data: { dateStart: string; dateEnd: string };
    index: number;
    documentId: string;
  }) {
    const dateStart = params.data.dateStart;
    const dateEnd = params.data.dateEnd;
    const index = params.index;
    const documentId = params.documentId;
    const document = await this.documentService.getDocument({
      elementId: documentId,
    });
    if (!document) return;

    if (!document?.elements) return;
    (document.elements[index].data as Note) = {
      reminder: {
        reminderStart: dateStart,
        reminderEnd: dateEnd,
      },
    };
    await this.updateDocument({ document });
  }
}
