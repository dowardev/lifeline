// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient';

export interface ExternalEventDto {
  id: number;
  title: string;
  date_start?: string | null;
  date_end?: string | null;
  time_zone?: string | null;
  description?: string | null;
  source_name?: string | null;
  source_color?: string | null;
}

export interface ExternalCalendarEvent {
  key: string;
  title: string;
  date_start?: string;
  date_end?: string;
  description?: string;
  sourceName: string;
  sourceColor: string;
}

function toViewItem(params: { dto: ExternalEventDto }): ExternalCalendarEvent {
  const { dto } = params;
  return {
    key: `ext-${dto.id}`,
    title: dto.title,
    date_start: dto.date_start ?? undefined,
    date_end: dto.date_end ?? undefined,
    description: dto.description ?? undefined,
    sourceName: dto.source_name ?? '',
    sourceColor: dto.source_color ?? '#3880ff',
  };
}

export const externalEventService = {
  async listExternalEvents(): Promise<ExternalCalendarEvent[]> {
    const response = (await apiClient.executeQuery({ url: '/external-events' })) as
      | { data: { events: ExternalEventDto[] } }
      | { events: ExternalEventDto[] };
    const dtos =
      typeof response === 'object' && response !== null && 'data' in response
        ? response.data.events
        : response.events;
    return (Array.isArray(dtos) ? dtos : []).map((dto) => toViewItem({ dto }));
  },
};
