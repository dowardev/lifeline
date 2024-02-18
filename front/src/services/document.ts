import { Storage } from "@ionic/storage";
import { DeleteDocument, Document, NewDocument } from "../utils/interfaces";

const store = new Storage();
store.create();

export class DocumentService {
  async getUserDocuments(): Promise<Array<Document> | null> {
    return await store.get("documents");
  }

  async getDocument(params: { elementId: string }): Promise<Document | null> {
    const elementId = params.elementId;
    const documents = await this.getUserDocuments();
    let document = null;

    if (!documents) return null;

    // console.log(elementId)
    document = documents?.filter((element) => {
      return element.id == elementId || element.url == elementId;
    })[0];

    return document ? document : null;
  }

  async saveDocument(params: {
    document: { title: string };
  }): Promise<{ document: Document }> {
    const document = {} as Document;
    const id = Date.now().toString();
    const title = params.document.title;
    const url = `${title.replace(" ", "-")}-${id}`;

    document.title = title;
    document.id = id;
    document.url = url;

    const documents =
      (await this.getUserDocuments()) != null
        ? await this.getUserDocuments()
        : [];
    documents?.push(document);
    await store.set("documents", documents);

    return { document };
  }

  async updateDocument(params: { document: Document }): Promise<void> {
    const document = params.document;
    let documents = await this.getUserDocuments();

    if (documents)
      documents = documents.map((element) => {
        if (element.id == document.id) return { ...element, ...document };
        return element;
      });

    await store.set("documents", documents);
  }

  async deleteUserDocument(params: DeleteDocument): Promise<void> {
    const id = params.documentId;
    const documents =
      (await this.getUserDocuments()) != null
        ? await this.getUserDocuments()
        : [];

    const index = documents?.findIndex((element) => element.id == id);
    if (index != undefined) {
      documents?.splice(index, 1);
      await store.set("documents", documents);
    }
  }
}
