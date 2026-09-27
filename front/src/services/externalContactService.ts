// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient';

export interface ExternalContactDto {
  id: number;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source_name?: string | null;
}

export interface ExternalContact {
  key: string;
  id: number;
  displayName: string;
  email: string;
  phone: string;
  sourceName: string;
}

/**
 * Backend response shape: `{ contacts: [...] }`. The per-collection `hidden`
 * flag is filtered server-side (see `ExternalEventController::contacts`), so
 * hidden collections never reach this reader — the UI does not need to
 * re-filter.
 *
 * Distinct key namespace from events (`ext-`) and tasks (`ext-task-`) so a
 * contact and an event or task can never collide downstream (e.g. if a future
 * reminder feature piggybacks on these keys).
 */
function toViewItem(params: { dto: ExternalContactDto }): ExternalContact {
  const { dto } = params;
  return {
    key: `ext-contact-${dto.id}`,
    id: dto.id,
    displayName: dto.display_name ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    sourceName: dto.source_name ?? '',
  };
}

export const externalContactService = {
  async listExternalContacts(): Promise<ExternalContact[]> {
    const response = (await apiClient.executeQuery({ url: '/external-contacts' })) as
      | { data: { contacts: ExternalContactDto[] } }
      | { contacts: ExternalContactDto[] };
    const dtos =
      typeof response === 'object' && response !== null && 'data' in response
        ? response.data.contacts
        : response.contacts;
    return (Array.isArray(dtos) ? dtos : []).map((dto) => toViewItem({ dto }));
  },
};
