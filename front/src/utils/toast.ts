import { toastController } from '@ionic/vue'

export async function showToast(params: { message: string; duration?: number; color?: string }) {
  const { message, duration = 2000, color = 'dark' } = params
  const toast = await toastController.create({
    message,
    duration,
    color,
    position: 'bottom',
  })
  await toast.present()
}

export async function showErrorToast(params: { message: string }) {
  const { message } = params
  await showToast({ message, color: 'danger' })
}
