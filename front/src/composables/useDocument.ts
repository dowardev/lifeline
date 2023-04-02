import { NewDocument, Document, DeleteDocument } from "../utils/interfaces";
import {
  getUserDocuments as getUserDocumentsService,
  getDocument as getDocumentService,
  saveDocument as saveDocumentService,
  updateDocument as updateDocumentService,
  deleteUserDocument as deleteUserDocumentService,
} from "../services/document";
import { useDocumentStore } from "../store/documentStore";
import { DocumentElements } from "../utils/types";

export const useDocument = () => {
  const documentStore = useDocumentStore();

  async function saveDocument(params: {
    document: { title: string };
  }): Promise<{ id: string; url: string } | null> {
    const documentData = params.document;
    let document = {} as Document;

    try {
      document = (
        await saveDocumentService({
          document: documentData,
        })
      ).document;
      documentStore.addDocument({ document });
      return { id: document.id, url: document.url };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadUserDocuments(): Promise<void> {
    const documents = await getUserDocumentsService();

    if (documents == null) return;

    documents.forEach((document) => {
      documentStore.addDocument({ document });
    });
  }

  async function loadDocument(params: { elementId: string }): Promise<void> {
    const elementId = params.elementId;
    const document = await getDocumentService({ elementId: elementId });

    if (document == null) return;

    documentStore.addDocument({ document });
  }

  function getUserDocuments(): Array<Document> | undefined {
    const documents = documentStore.getDocuments();
    return documents != null
      ? JSON.parse(JSON.stringify(documents))
      : undefined;
  }

  async function deleteDocument(params: DeleteDocument): Promise<void> {
    const documentId = params.documentId;
    await deleteUserDocumentService({ documentId });
    documentStore.removeDocument({ documentId });
  }

  function getUserDocument(params: {
    documentId?: string;
    documentUrl?: string;
  }): Document | undefined {
    const documentId = params.documentId;
    const documentUrl = params.documentUrl;

    let document = "" as any;
    if (documentId)
      document = documentStore.getDocument({ elementSearch: documentId });
    if (documentUrl)
      document = documentStore.getDocument({ elementSearch: documentUrl });

    return document ? document : undefined;
  }

  async function updateDocument(params: { document: Document }): Promise<void> {
    try {
      const document = JSON.parse(JSON.stringify(params.document));
      await updateDocumentService({ document });
      documentStore.updateDocument({ document });
    } catch (error: any) {
      console.error(error);
    }
  }

  function deleteElement(params: { index: number; documentId: string }) {
    const index = params.index;
    const documentId = params.documentId;

    documentStore.removeElement({ index, documentId });
  }

  function insertElement(params: {
    documentId: string;
    element: DocumentElements;
  }) {
    const documentId = params.documentId;
    const element = params.element;

    useDocumentStore().insertElement({ documentId, element });
  }
  return {
    deleteDocument,
    saveDocument,
    loadUserDocuments,
    getUserDocument,
    updateDocument,
    getUserDocuments,
    deleteElement,
    insertElement,
    loadDocument,
  };
};
