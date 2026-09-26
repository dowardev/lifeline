// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient';

export interface ExternalTaskDto {
  id: number;
  title: string;
  status?: string | null;
  due_at?: string | null;
  description?: string | null;
  source_name?: string | null;
  reminder_offsets_seconds?: number[] | null;
}

export interface ExternalTask {
  key: string;
  title: string;
  status?: string;
  due_at?: string;
  description?: string;
  sourceName: string;
  reminderOffsetsSeconds?: number[];
}

/**
 * Backend offsets arrive as seconds before `due_at` (positive = before,
 * negative = after), sorted descending and capped at 10. Normalize missing or
 * malformed payloads to `[]` and keep only finite numeric entries so a single
 * bad value cannot poison scheduling downstream.
 */
function normalizeOffsets(params: {
  offsets: number[] | null | undefined;
}): number[] {
  const { offsets } = params;
  if (!Array.isArray(offsets)) return [];
  return offsets.filter((value) => Number.isFinite(value));
}

function toViewItem(params: { dto: ExternalTaskDto }): ExternalTask {
  const { dto } = params;
  return {
    // Separate namespace from events (`ext-<id>`): a task and an event can
    // share the same numeric id, and their notifications must not collide.
    key: `ext-task-${dto.id}`,
    title: dto.title,
    status: dto.status ?? undefined,
    due_at: dto.due_at ?? undefined,
    description: dto.description ?? undefined,
    sourceName: dto.source_name ?? '',
    reminderOffsetsSeconds: normalizeOffsets({
      offsets: dto.reminder_offsets_seconds,
    }),
  };
}

export const externalTaskService = {
  async listExternalTasks(): Promise<ExternalTask[]> {
    const response = (await apiClient.executeQuery({ url: '/external-tasks' })) as
      | { data: { tasks: ExternalTaskDto[] } }
      | { tasks: ExternalTaskDto[] };
    const dtos =
      typeof response === 'object' && response !== null && 'data' in response
        ? response.data.tasks
        : response.tasks;
    return (Array.isArray(dtos) ? dtos : []).map((dto) => toViewItem({ dto }));
  },
};
