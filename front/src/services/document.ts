import { Storage } from "@ionic/storage";
import {
  DeleteDocument,
  Document,
  NewDocument,
} from "../utils/interfaces";

const store = new Storage();
store.create();

export async function getUserDocuments(): Promise<Array<Document> | null> {
  return await store.get("documents");
}

export async function saveDocument(params: {
  document: NewDocument;
}): Promise<{ id: string }> {
  await store.clear();
  const document = JSON.parse(JSON.stringify(params.document));
  const id = Date.now().toString();
  document.id = id;
  const documents =
    (await getUserDocuments()) != null ? await getUserDocuments() : [];
  documents?.push(document);

  await store.set("documents", documents);
  return { id };
}

export async function updateDocument(params: {
  document: Document;
}): Promise<void> {
  const document = params.document;
  let documents = await getUserDocuments();

  if (documents)
    documents = documents.map((element) => {
      if (element.id == document.id) return { ...element, ...document };
      return element;
    });

  await store.set("documents", documents);
}

export async function deleteUserDocument(
  params: DeleteDocument
): Promise<void> {
  const id = params.documentId;
  const documents =
    (await getUserDocuments()) != null ? await getUserDocuments() : [];

  const index = documents?.findIndex((element) => element.id == id);
  if (index != undefined) {
    documents?.splice(index, 1);
    await store.set("documents", documents);
  }
}
