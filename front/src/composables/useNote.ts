// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { NoteController } from '@/controllers/noteController'

export function useNote(): {
  loadNotes: NoteController['loadNotes']
  createNote: NoteController['createNote']
  updateNote: NoteController['updateNote']
  deleteNote: NoteController['deleteNote']
} {
  const controller = new NoteController()
  return {
    loadNotes: controller.loadNotes.bind(controller),
    createNote: controller.createNote.bind(controller),
    updateNote: controller.updateNote.bind(controller),
    deleteNote: controller.deleteNote.bind(controller),
  }
}
