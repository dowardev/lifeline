const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function getDayName(params: { dayOfWeek: number }): string {
  const { dayOfWeek } = params
  return DAY_NAMES[dayOfWeek] || ''
}

export function getDayNameShort(params: { dayOfWeek: number }): string {
  const { dayOfWeek } = params
  return DAY_NAMES_SHORT[dayOfWeek] || ''
}

export function getMonthName(params: { month: number }): string {
  const { month } = params
  return MONTH_NAMES[month] || ''
}
