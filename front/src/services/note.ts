import { Storage } from "@ionic/storage";
import { NewNote, Note } from "../utils/interfaces";

const store = new Storage();
store.create();

export async function getNotes(): Promise<Array<Note | null>> {
  return await store.get("notes");
}

export async function saveNote(params: {
  note: Note;
}): Promise<{ id: string }> {
  const note = JSON.parse(JSON.stringify(params.note));
  const id = Date.now().toString();
  note.id = id;
  const notes = (await getNotes()) != null ? await getNotes() : [];

  notes?.push(note);

  // await store.set("documents", documents);
  return { id };
}

// export async function getMedicine(params: { id: string }): Promise<Document> {
//   const id = params.id;
//   const documents = await store.get("documents");
//
//   return documents.filter((element: Document) => {
//     if (element.id == id) return element;
//   })[0];
// }
