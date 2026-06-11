import { NoteController } from '@/controllers/noteController'

export function useNote() {
  const controller = new NoteController()
  return {
    loadNotes: controller.loadNotes.bind(controller),
    createNote: controller.createNote.bind(controller),
    updateNote: controller.updateNote.bind(controller),
    deleteNote: controller.deleteNote.bind(controller),
  }
}
