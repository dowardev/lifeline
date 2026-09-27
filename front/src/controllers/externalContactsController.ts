// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { externalContactService } from '@/services/externalContactService';
import type { ExternalContact } from '@/services/externalContactService';

/**
 * Read-only controller for the external contacts surfaced by
 * `ExternalEventController::contacts`. The data already comes filtered by
 * the per-collection `hidden` flag on the server side (LBDS-266), so this
 * controller does not re-filter — it is a thin wrapper that lets the page
 * stay declarative and let errors propagate to the UI for explicit
 * empty/error/loading states (per LBDS-271 acceptance).
 */
export class ExternalContactsController {
  async loadContacts(): Promise<ExternalContact[]> {
    return externalContactService.listExternalContacts();
  }
}
