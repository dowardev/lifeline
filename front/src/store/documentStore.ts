// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DocumentItem {
  id: number
  user_id: number
  title: string
  type: 'note' | 'list' | 'richtext' | 'todo'
  content?: unknown
  order?: number
  url?: string
  elements?: unknown[]
}

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<DocumentItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setDocuments(params: { documents: DocumentItem[] }): void {
    documents.value = params.documents
  }

  function addDocument(params: { document: DocumentItem }): void {
    documents.value.push(params.document)
  }

  function updateDocument(params: { id: number; updates: Partial<DocumentItem> }): void {
    const { id, updates } = params
    const index = documents.value.findIndex((d) => d.id === id)
    if (index !== -1) documents.value[index] = { ...documents.value[index], ...updates }
  }

  function removeDocument(params: { id: number }): void {
    documents.value = documents.value.filter((d) => d.id !== params.id)
  }

  function getDocuments(): DocumentItem[] | undefined {
    return documents.value.length > 0 ? [...documents.value] : undefined
  }

  function getDocument(params: { elementSearch: string }): DocumentItem | undefined {
    const { elementSearch } = params
    return documents.value.find((d) => String(d.id) === elementSearch || d.url === elementSearch)
  }

  function setLoading(params: { loading: boolean }): void {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }): void {
    error.value = params.error
  }

  function clearError(): void {
    error.value = null
  }

  return { documents, loading, error, setDocuments, addDocument, updateDocument, removeDocument, getDocuments, getDocument, setLoading, setError, clearError }
})
