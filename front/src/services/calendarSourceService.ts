// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient';

export interface TestConnectionResponse {
  ok: boolean;
  event_count?: number;
}

export interface DiscoveredCollection {
  href: string;
  name: string;
  type: string;
  subscribed: boolean;
  hidden: boolean;
}

export interface CalendarSourceDto {
  id: number;
  type: string;
  name: string;
  url: string;
  username: string | null;
  has_password: boolean;
  color: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_error: string | null;
  collections: DiscoveredCollection[];
}

function unwrapData(response: unknown): Record<string, unknown> {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data: Record<string, unknown> }).data;
  }
  return response as Record<string, unknown>;
}

export const calendarSourceService = {
  async testConnection(params: {
    type: 'ics' | 'caldav';
    url: string;
    username?: string;
    password?: string;
  }): Promise<TestConnectionResponse> {
    const response = await apiClient.executeMutation({
      url: '/calendar-sources/test',
      data: params,
    });
    return unwrapData(response) as unknown as TestConnectionResponse;
  },

  async listSources(): Promise<CalendarSourceDto[]> {
    const response = await apiClient.executeQuery({ url: '/calendar-sources' });
    return (unwrapData(response).sources ?? []) as CalendarSourceDto[];
  },

  async createSource(params: {
    type: 'ics' | 'caldav';
    name: string;
    url?: string;
    username?: string;
    password?: string;
    color?: string;
  }): Promise<CalendarSourceDto> {
    const response = await apiClient.executeMutation({ url: '/calendar-sources', data: params });
    return unwrapData(response).source as CalendarSourceDto;
  },

  async updateSource(params: {
    id: number;
    name?: string;
    url?: string;
    username?: string;
    password?: string;
    color?: string;
    collections?: { href: string; subscribed: boolean }[];
  }): Promise<CalendarSourceDto> {
    const { id, ...data } = params;
    const response = await apiClient.executeMutation({
      url: `/calendar-sources/${id}`,
      data,
      method: 'PUT',
    });
    return unwrapData(response).source as CalendarSourceDto;
  },

  async removeSource(params: { id: number }): Promise<void> {
    await apiClient.executeDelete({ url: `/calendar-sources/${params.id}` });
  },

  async syncSource(params: {
    id: number;
    collectionHref?: string;
  }): Promise<{ ok: boolean; upserted: number; pruned: number }> {
    const response = await apiClient.executeMutation({
      url: `/calendar-sources/${params.id}/sync`,
      data: params.collectionHref !== undefined ? { collection_href: params.collectionHref } : {},
    });
    return unwrapData(response) as unknown as { ok: boolean; upserted: number; pruned: number };
  },

  async getGoogleAuthorizeUrl(): Promise<string> {
    const response = await apiClient.executeQuery({ url: '/calendar-sources/google/authorize' });
    return (unwrapData(response).url ?? '') as string;
  },

  async discoverCollections(params: { id: number }): Promise<DiscoveredCollection[]> {
    const response = await apiClient.executeMutation({
      url: `/calendar-sources/${params.id}/discover`,
    });
    return (unwrapData(response).collections ?? []) as DiscoveredCollection[];
  },
};
