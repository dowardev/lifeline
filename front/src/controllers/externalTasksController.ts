// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { externalTaskService } from '@/services/externalTaskService';
import type { ExternalTask } from '@/services/externalTaskService';

/**
 * Read-only controller for the external tasks (Google Tasks / CalDAV VTODO)
 * surfaced by `ExternalEventController::tasks`. Mirrors the contacts
 * controller: thin wrapper, lets errors propagate to the UI for explicit
 * empty/error/loading states.
 */
export class ExternalTasksController {
  async loadTasks(): Promise<ExternalTask[]> {
    return externalTaskService.listExternalTasks();
  }
}
