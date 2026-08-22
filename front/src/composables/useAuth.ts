// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { AuthController } from '@/controllers/authController'

export function useAuth(): {
  loadUser: AuthController['loadUser']
  logout: AuthController['logout']
  isLoggedIn: AuthController['isLoggedIn']
  getCurrentUser: AuthController['getCurrentUser']
} {
  const controller = new AuthController()
  return {
    loadUser: controller.loadUser.bind(controller),
    logout: controller.logout.bind(controller),
    isLoggedIn: controller.isLoggedIn.bind(controller),
    getCurrentUser: controller.getCurrentUser.bind(controller),
  }
}
