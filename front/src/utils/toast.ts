// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { toastController } from '@ionic/vue'

export async function showToast(params: { message: string; duration?: number; color?: string }): Promise<void> {
  const { message, duration = 2000, color = 'dark' } = params
  const toast = await toastController.create({
    message,
    duration,
    color,
    position: 'bottom',
  })
  await toast.present()
}

export async function showErrorToast(params: { message: string }): Promise<void> {
  const { message } = params
  await showToast({ message, color: 'danger' })
}
