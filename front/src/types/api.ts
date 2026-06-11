export interface TaskItem {
  id: number
  user_id: number
  title: string
  description?: string | null
  status?: string | null
  priority?: number | null
  due_date?: string | null
  subtasks?: unknown | null
  order?: number | null
  created_at?: string
  updated_at?: string
}

export interface DocumentItem {
  id: number
  user_id: number
  title: string
  type?: string | null
  content?: unknown | null
  order?: number | null
  created_at?: string
  updated_at?: string
}

export interface NoteItem {
  id: number
  user_id: number
  title: string
  content?: string | null
  document_id?: number | null
  reminder?: string | null
  created_at?: string
  updated_at?: string
}
