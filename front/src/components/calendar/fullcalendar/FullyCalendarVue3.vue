<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div class="fullcalendar-wrapper">
    <FullCalendar ref="fullCalendarRef" :options="calendarOptions" />
  </div>
</template>

<script lang="ts" setup>
// 1. Imports (ionic/vue/ionicons)
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'

// 2. Controllers / Composables
// (none)

// 3. Components
import FullCalendar from '@fullcalendar/vue3'

// 4. Interface and types imports
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core'
import type { EventItem } from '@/store/eventStore'

// 5. Main (props, emits)
const props = withDefaults(defineProps<{
  events: EventItem[]
  currentView: string
  currentDate: Date
  locale?: string
  isMobile?: boolean
}>(), {
  locale: 'es',
})

const emit = defineEmits<{
  (e: 'dateClick', value: { date: Date; endDate?: Date; allDay: boolean; jsEvent: MouseEvent | TouchEvent | null }): void
  (e: 'eventClick', value: { event: { id: string | number } }): void
  (e: 'eventUpdate', value: { id: number; dateStart: string; dateEnd?: string }): void
  (e: 'viewChange', value: string): void
  (e: 'dateChange', value: Date): void
}>()

// 6. Vars and const
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const nowSlotInterval = ref<number | null>(null)
const detectedIsMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

const resolvedIsMobile = computed(() => props.isMobile ?? detectedIsMobile.value)

const viewMapping: Record<string, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  diary: 'listWeek',
}

const mapEventsToFullCalendar = computed<EventInput[]>(() => {
  return props.events.map((event) => ({
    id: String(event.id),
    title: event.title,
    start: event.date_start || '',
    end: event.date_end || undefined,
    allDay: !event.date_start?.includes(':'),
    color: '#3880ff',
    textColor: '#ffffff',
    extendedProps: {
      description: event.description,
      availability: event.availability,
      calendarId: event.calendar_id,
    },
  }))
})

const calendarOptions = computed(() => ({
  plugins: [timeGridPlugin, interactionPlugin, listPlugin],
  initialView: viewMapping[props.currentView] || 'timeGridWeek',
  initialDate: props.currentDate.toISOString().split('T')[0],
  locale: esLocale,
  dayHeaderFormat: { weekday: 'long', day: 'numeric' } as const,
  listDayFormat: { weekday: 'long', day: 'numeric' } as const,
  listDaySideFormat: false as const,
  headerToolbar: false as false,
  nowIndicator: true,
  events: mapEventsToFullCalendar.value,
  selectable: true,
  selectAllow: (): boolean => true,
  selectMirror: false,
  longPressDelay: resolvedIsMobile.value ? 180 : 1000,
  selectLongPressDelay: resolvedIsMobile.value ? 300 : 1000,
  eventLongPressDelay: resolvedIsMobile.value ? 300 : 500,
  dayMaxEvents: true,
  weekends: true,
  height: '100%',
  editable: !resolvedIsMobile.value,
  touch: true,
  dateClick: (info: { date: Date; dateStr: string; allDay: boolean; jsEvent: MouseEvent | TouchEvent | null }): void => {
    emit('dateClick', {
      date: info.date,
      endDate: info.allDay ? info.date : new Date(info.date.getTime() + 30 * 60 * 1000),
      allDay: info.allDay,
      jsEvent: info.jsEvent,
    })
  },
  select: (info: DateSelectArg): void => {
    const isDrag = info.end.getTime() - info.start.getTime() > 30 * 60 * 1000
    if (resolvedIsMobile.value && isDrag) {
      fullCalendarRef.value?.getApi().unselect()
      return
    }
    let endDate = info.end
    if (!info.allDay) {
      endDate = new Date(info.end.getTime() - 30 * 60 * 1000)
    }
    emit('dateClick', {
      date: info.start,
      endDate,
      allDay: info.allDay,
      jsEvent: info.jsEvent,
    })
  },
  eventClick: (info: EventClickArg): void => {
    emit('eventClick', {
      event: { id: info.event.id },
    })
  },
  eventDrop: (info: EventDropArg): void => {
    const id = typeof info.event.id === 'string' ? parseInt(info.event.id, 10) : info.event.id
    emit('eventUpdate', {
      id,
      dateStart: info.event.start?.toISOString() || '',
      dateEnd: info.event.end?.toISOString() || undefined,
    })
  },
  eventResize: (info: { event: { id: string | number; start: Date | null; end: Date | null } }): void => {
    const ev = info.event
    const id = typeof ev.id === 'string' ? parseInt(ev.id, 10) : ev.id
    emit('eventUpdate', {
      id,
      dateStart: ev.start?.toISOString() || '',
      dateEnd: ev.end?.toISOString() || undefined,
    })
  },
  eventContent: (arg: EventContentArg): { html: string } => {
    if (arg.event.allDay) {
      return { html: `<span class="fc-event-title">${arg.event.title}</span>` }
    }
    const startStr = arg.event.start
      ? arg.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : ''
    return {
      html: `<div class="fc-event-custom"><div class="fc-event-time">${startStr}</div><div class="fc-event-title">${arg.event.title}</div></div>`,
    }
  },
  viewDidMount: ({ view }: { view: { type: string } }): void => {
    emit('viewChange', view.type)
  },
  datesSet: (info: { start: Date }): void => {
    emit('dateChange', info.start)
  },
}))

// 7. Watch
watch(() => props.currentView, (newView) => {
  if (!fullCalendarRef.value) return
  const api = fullCalendarRef.value.getApi()
  const currentFcView = api.view.type
  const targetFcView = viewMapping[newView] || newView
  if (currentFcView !== targetFcView) {
    api.changeView(targetFcView)
    refreshNowHighlight()
  }
})

watch(() => props.currentDate, (newDate) => {
  if (!fullCalendarRef.value) return
  const api = fullCalendarRef.value.getApi()
  const currentDate = api.getDate()
  const diffMs = Math.abs(newDate.getTime() - currentDate.getTime())
  if (diffMs > 60000) {
    api.gotoDate(newDate)
    refreshNowHighlight()
  }
})

watch(() => props.events, () => {
  if (!fullCalendarRef.value) return
  const api = fullCalendarRef.value.getApi()
  api.setOption('events', mapEventsToFullCalendar.value)
}, { deep: true })

// 8. Computed
// (defined above)

// 9. OnMounted
onMounted(() => {
  detectedIsMobile.value = window.innerWidth < 768
  window.addEventListener('resize', onResize)
  startNowSlotHighlighting()
  setTimeout(() => {
    if (!fullCalendarRef.value) return
    const api = fullCalendarRef.value.getApi()
    api.setOption('events', mapEventsToFullCalendar.value)
    api.render()
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  stopNowSlotHighlighting()
})

// 10. Functions (named parameters pattern)
function gotoDate(params: { date: Date }): void {
  const { date } = params
  fullCalendarRef.value?.getApi().gotoDate(date)
  refreshNowHighlight()
}

function changeView(params: { view: string }): void {
  const { view } = params
  const fcView = viewMapping[view] || view
  fullCalendarRef.value?.getApi().changeView(fcView)
  refreshNowHighlight()
}

function today(): void {
  fullCalendarRef.value?.getApi().today()
  refreshNowHighlight()
}

function refresh(): void {
  fullCalendarRef.value?.getApi().refetchEvents()
}

function updateNowSlotHighlight(): void {
  const api = fullCalendarRef.value?.getApi()
  if (!api) return

  document.querySelectorAll('.fc-timegrid-slot.highlight-now-slot')
    .forEach(el => el.classList.remove('highlight-now-slot'))

  const now = new Date()
  const viewType = api.view.type

  if (viewType === 'timeGridDay' || viewType === 'timeGridWeek') {
    const slots = document.querySelectorAll('.fc-timegrid-slot')
    slots.forEach(slot => {
      const label = slot.querySelector('.fc-timegrid-slot-label')
      if (label) {
        const timeText = label.textContent?.trim()
        if (timeText) {
          const timeMatch = timeText.match(/(\d+):(\d+)\s*(AM|PM)/)
          if (timeMatch) {
            let hours = parseInt(timeMatch[1])
            const minutes = parseInt(timeMatch[2])
            const ampm = timeMatch[3]

            if (ampm === 'PM' && hours !== 12) hours += 12
            if (ampm === 'AM' && hours === 12) hours = 0

            const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0)
            const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

            if (now >= slotStart && now < slotEnd) {
              slot.classList.add('highlight-now-slot')
            }
          }
        }
      }
    })
  }
}

function startNowSlotHighlighting(): void {
  if (nowSlotInterval.value !== null) return
  updateNowSlotHighlight()
  nowSlotInterval.value = window.setInterval(updateNowSlotHighlight, 1000)
}

function refreshNowHighlight(): void {
  updateNowSlotHighlight()
}

function onResize(): void {
  detectedIsMobile.value = window.innerWidth < 768
}

function stopNowSlotHighlighting(): void {
  if (nowSlotInterval.value !== null) {
    clearInterval(nowSlotInterval.value)
    nowSlotInterval.value = null
  }
  document.querySelectorAll('.fc-timegrid-slot.highlight-now-slot')
    .forEach(el => el.classList.remove('highlight-now-slot'))
}

defineExpose({ gotoDate, changeView, today, refresh, startNowSlotHighlighting, stopNowSlotHighlighting, refreshNowHighlight })
</script>

<style scoped>
.fullcalendar-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  touch-action: manipulation;
}

.fullcalendar-wrapper :deep(.fc) {
  --fc-border-color: var(--ion-color-light-tint, #e0e0e0);
  --fc-today-bg-color: var(--ion-color-light, rgba(56, 128, 255, 0.05));
  --fc-event-bg-color: var(--ion-color-primary, #3880ff);
  --fc-event-border-color: var(--ion-color-primary, #3880ff);
  --fc-event-text-color: #ffffff;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: var(--ion-background-color, #ffffff);
  --fc-list-event-hover-bg-color: var(--ion-color-light, #f4f5f8);
  --fc-now-indicator-color: #3880ff;
  font-family: var(--ion-font-family, inherit);
}

.fullcalendar-wrapper :deep(.fc-toolbar-title) {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-text-color, #000);
}

.fullcalendar-wrapper :deep(.fc-button) {
  background-color: var(--ion-color-light, #f4f5f8);
  border-color: var(--ion-color-light-shade, #d7d8da);
  color: var(--ion-text-color, #000);
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.fullcalendar-wrapper :deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background-color: var(--ion-color-primary, #3880ff);
  border-color: var(--ion-color-primary, #3880ff);
  color: #ffffff;
}

.fullcalendar-wrapper :deep(.fc-button-primary:hover) {
  background-color: var(--ion-color-primary-shade, #3171e0);
  border-color: var(--ion-color-primary-shade, #3171e0);
  color: #ffffff;
}

.fullcalendar-wrapper :deep(.fc-button-primary:disabled) {
  opacity: 0.5;
}

.fullcalendar-wrapper :deep(.fc-event) {
  border-radius: 4px;
  border: none;
  padding: 2px 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fullcalendar-wrapper :deep(.fc-event:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.fullcalendar-wrapper :deep(.fc-day-today) {
  background-color: var(--ion-color-light, rgba(56, 128, 255, 0.05)) !important;
}

.fullcalendar-wrapper :deep(.fc-daygrid-day-number) {
  color: var(--ion-text-color, #000);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 4px 6px;
}

.fullcalendar-wrapper :deep(.fc-col-header-cell-cushion) {
  color: var(--ion-text-color, #000);
  font-weight: 600;
  font-size: 0.8rem;
  padding: 8px 4px;
}

.fullcalendar-wrapper :deep(.fc-timegrid-slot) {
  height: 3rem;
}

.fullcalendar-wrapper :deep(.fc-timegrid-slot-label) {
  font-size: 0.75rem;
  color: var(--ion-text-color-step-600, #666);
}

.fullcalendar-wrapper :deep(.fc-list-day-text) {
  color: var(--ion-text-color, #000);
}

.fullcalendar-wrapper :deep(.fc-list-day-side-text) {
  color: var(--ion-text-color-step-600, #666);
}

.fullcalendar-wrapper :deep(.fc-list-event-title) {
   font-weight: 500;
}

.fullcalendar-wrapper :deep(.fc-toolbar),
.fullcalendar-wrapper :deep(.fc-header-toolbar),
.fullcalendar-wrapper :deep(.fc .fc-toolbar) {
   display: none !important;
}

.fullcalendar-wrapper :deep(.fc-event-custom) {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 1px 0;
}

.fullcalendar-wrapper :deep(.fc-event-time) {
   font-size: 0.7rem;
   font-weight: 500;
   opacity: 0.9;
}
</style>

<style>
.fullcalendar-wrapper .fc-scrollgrid {
  border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.08) !important;
}

.fullcalendar-wrapper .fc-scrollgrid td {
  border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06) !important;
}

.fullcalendar-wrapper .fc-scrollgrid th {
  border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.08) !important;
  border-bottom: 2px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.1) !important;
}

.fullcalendar-wrapper .fc-daygrid-day-frame {
  border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.04) !important;
  min-height: 80px;
}

.fullcalendar-wrapper .fc-timegrid-slot {
  border-bottom: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.04) !important;
}

.fullcalendar-wrapper .fc-timegrid-slot-label {
  border-right: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06) !important;
}

.fullcalendar-wrapper .fc-timegrid-col {
  border-right: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06) !important;
}

.fullcalendar-wrapper .fc-timegrid-col.fc-day-today {
  background-color: rgba(var(--ion-color-light-rgb, 56, 128, 255), 0.03) !important;
}

.fullcalendar-wrapper .fc-day-other .fc-daygrid-day-top {
  opacity: 0.4;
}
</style>
