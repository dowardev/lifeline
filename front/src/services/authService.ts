// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient'

export const authService = {
  logout(): Promise<unknown> {
    return apiClient.executeMutation({ url: '/auth/logout' })
  },

  getUser(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/auth/user' })
  },
}
