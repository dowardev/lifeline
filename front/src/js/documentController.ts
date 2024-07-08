import { Document, DeleteDocument, Note } from "../utils/interfaces";
import { useDocumentStore } from "../store/documentStore";
import { DocumentElements } from "../utils/types";
import { storage } from "@/main";

export class DocumentController {
  documentStore = useDocumentStore();
  // documentService = new DocumentService();

  async saveDocument(params: {
    document: { title: string };
  }): Promise<{ id: string; url: string } | null> {
    const document = {} as Document;
    const id = Date.now().toString();
    const title = params.document.title;
    const url = `${title.replace(" ", "-")}-${id}`;

    document.title = title;
    document.id = id;
    document.url = url;

    try {
      const documents =
        (await this.getLocalUserDocuments()) != null
          ? await this.getLocalUserDocuments()
          : [];
      documents?.push(document);
      await storage.set("documents", documents);
      this.documentStore.addDocument({ document });
      return { id: document.id, url: document.url };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async loadUserDocuments(): Promise<void> {
    const documents = await this.getLocalUserDocuments();

    if (documents == null) return;

    documents.forEach((document) => {
      this.documentStore.addDocument({ document });
    });
  }

  async loadDocument(params: { elementId: string }): Promise<void> {
    const elementId = params.elementId;
    const document = await this.getLocalUserDocument({
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
    await this.deleteLocalUserDocument({ documentId });
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
      await this.updateLocalUserDocument({ document });
      this.documentStore.updateDocument({ document });
    } catch (error: any) {
      console.error(error);
    }
  }

  deleteElement(params: { index: number; documentId: string }): void {
    const index = params.index;
    const documentId = params.documentId;

    this.documentStore.removeElement({ index, documentId });
  }

  insertElement(params: {
    documentId: string;
    element: DocumentElements;
  }): void {
    const documentId = params.documentId;
    const element = params.element;

    useDocumentStore().insertElement({ documentId, element });
  }

  async updateNoteValue(params: {
    data: { value: string };
    index: number;
    documentId: string;
  }): Promise<void> {
    const value = params.data.value;
    const index = params.index;
    const documentId = params.documentId;
    const document = await this.getLocalUserDocument({
      elementId: documentId,
    });
    if (!document) return;

    const note = document?.elements![index].data as Note;
    note.content = value;
    await this.updateLocalUserDocument({ document });

    if (!document?.elements) return;
    (document.elements[index].data as Note).content = value;
    await this.updateLocalUserDocument({ document });
  }

  async updateNoteReminder(params: {
    data: { dateStart: string; dateEnd: string };
    index: number;
    documentId: string;
  }): Promise<void> {
    const dateStart = params.data.dateStart;
    const dateEnd = params.data.dateEnd;
    const index = params.index;
    const documentId = params.documentId;
    const document = await this.getLocalUserDocument({
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

  async getLocalUserDocuments(): Promise<Array<Document> | null> {
    return await storage.get("documents");
  }

  async getLocalUserDocument(params: {
    elementId: string;
  }): Promise<Document | null> {
    const elementId = params.elementId;
    const documents = await this.getLocalUserDocuments();
    let document = null;

    if (!documents) return null;

    // console.log(elementId)
    document = documents?.filter((element) => {
      return element.id == elementId || element.url == elementId;
    })[0];

    return document ? document : null;
  }

  async updateLocalUserDocument(params: { document: Document }): Promise<void> {
    const document = params.document;
    let documents = await this.getLocalUserDocuments();

    if (documents)
      documents = documents.map((element) => {
        if (element.id == document.id) return { ...element, ...document };
        return element;
      });

    await storage.set("documents", documents);
  }

  async deleteLocalUserDocument(params: DeleteDocument): Promise<void> {
    const id = params.documentId;
    const documents =
      (await this.getLocalUserDocuments()) != null
        ? await this.getLocalUserDocuments()
        : [];

    const index = documents?.findIndex((element) => element.id == id);
    if (index != undefined) {
      documents?.splice(index, 1);
      await storage.set("documents", documents);
    }
  }
}
