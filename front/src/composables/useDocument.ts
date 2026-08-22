// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { DocumentController } from '@/controllers/documentController'

export function useDocument(): {
  loadDocuments: DocumentController['loadDocuments']
  getUserDocuments: DocumentController['getUserDocuments']
  getUserDocument: DocumentController['getUserDocument']
  createDocument: DocumentController['createDocument']
  updateDocument: DocumentController['updateDocument']
  deleteDocument: DocumentController['deleteDocument']
  removeElement: DocumentController['removeElement']
  insertElement: DocumentController['insertElement']
  updateNoteValue: DocumentController['updateNoteValue']
  updateNoteReminder: DocumentController['updateNoteReminder']
} {
  const controller = new DocumentController()
  return {
    loadDocuments: controller.loadDocuments.bind(controller),
    getUserDocuments: controller.getUserDocuments.bind(controller),
    getUserDocument: controller.getUserDocument.bind(controller),
    createDocument: controller.createDocument.bind(controller),
    updateDocument: controller.updateDocument.bind(controller),
    deleteDocument: controller.deleteDocument.bind(controller),
    removeElement: controller.removeElement.bind(controller),
    insertElement: controller.insertElement.bind(controller),
    updateNoteValue: controller.updateNoteValue.bind(controller),
    updateNoteReminder: controller.updateNoteReminder.bind(controller),
  }
}
