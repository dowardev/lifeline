import { NewDocument, Document, DeleteDocument } from "../utils/interfaces";
import {
  getUserDocuments as getUserDocumentsService,
  saveDocument as saveDocumentService,
  updateDocument as updateDocumentService,
  deleteUserDocument as deleteUserDocumentService,
} from "../services/document";
import { useDocumentStore } from "../store/documentStore";

export const useDocument = () => {
  const documentStore = useDocumentStore();

  async function saveDocument(params: {
    document: NewDocument;
  }): Promise<{ id: string }> {
    const document = JSON.parse(JSON.stringify(params.document));

    try {
      const { id } = await saveDocumentService({ document });
      document.id = id;
      documentStore.addDocument({ document });
      return { id };
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

  async function getUserDocument(params: {
    documentId: string;
  }): Promise<Document> {
    const documentId = params.documentId;
    const document = documentStore.getDocument({ documentId });
    return document != null ? JSON.parse(JSON.stringify(document)) : undefined;
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

  return {
    deleteDocument,
    saveDocument,
    loadUserDocuments,
    getUserDocument,
    updateDocument,
    getUserDocuments,
    deleteElement
  };
};
