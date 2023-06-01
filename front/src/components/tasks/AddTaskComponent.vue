<template>
  <ion-page>
    <ion-header collapse="fade" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="modalController.dismiss()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button><ion-icon :icon="saveOutline"></ion-icon></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- basic -->
      <ion-list>
        <ion-list-header>
          <ion-label>Basico</ion-label>
        </ion-list-header>

        <ion-row class="ion-padding">
          <ion-col>
            <ion-input
              label="Titulo"
              label-placement="floating"
              fill="solid"
            ></ion-input>

            <br />

            <ion-textarea
              label="Descripcion"
              label-placement="floating"
              fill="solid"
            ></ion-textarea>
          </ion-col>
        </ion-row>
      </ion-list>

      <!-- time -->
      <ion-list>
        <ion-list-header>
          <ion-label>Tiempo</ion-label>
        </ion-list-header>
        <ion-row>
          <ion-col size-xs="11" size="10">
            <div style="display: flex">
              <div>
                <ion-button fill="clear" :disabled="true"
                  ><ion-icon :icon="globeOutline"></ion-icon
                ></ion-button>
              </div>

              <div style="width: 100%">
                <!-- dates -->
                <ion-textarea
                  label="Tiempo"
                  label-placement="floating"
                  fill="solid"
                  :value="
                    format(new Date(event.reminders.value.start), 'Pp') +
                    '\n' +
                    format(new Date(event.reminders.value.end), 'Pp')
                  "
                  @click="
                    popoverRemindersSegment = 'date-start';
                    isOpenPopoverReminders = true;
                  "
                ></ion-textarea>

                <!-- notifications -->
                <section v-if="event.reminders.value.notifications.length > 0">
                  <ion-textarea
                    label="Notificaciones"
                    label-placement="floating"
                    fill="solid"
                    :value="formatTextNotifications()"
                    @click="
                      popoverRemindersSegment = 'reminders';
                      isOpenPopoverReminders = true;
                    "
                  ></ion-textarea>
                </section>

                <!-- repeat -->
                <section v-if="event.reminders.value.repeat">
                  <ion-textarea
                    label="Repetir"
                    label-placement="floating"
                    fill="solid"
                    :value="formatTextRepeat()"
                    @click="
                      popoverRemindersSegment = 'repeats';
                      isOpenPopoverReminders = true;
                    "
                  ></ion-textarea>
                </section>
              </div>
            </div>
          </ion-col>
        </ion-row>

        <br />

        <!-- time zone -->
        <ion-row>
          <ion-col size-xs="11" size="10">
            <div style="display: flex">
              <div style="display: flex; align-items: center">
                <ion-button fill="clear" :disabled="true"
                  ><ion-icon :icon="timeOutline"></ion-icon
                ></ion-button>
              </div>

              <div style="width: 100%">
                <ion-item
                  fill="solid"
                  lines="none"
                  @click="isOpenPopoverTimezones = true"
                >
                  <ion-label>Zona horaria</ion-label>
                  <ion-label slot="end" class="ion-text-wrap"
                    >{{ event.timezone.value }}
                  </ion-label>
                </ion-item>
              </div>
            </div>
          </ion-col>
        </ion-row>
      </ion-list>

      <!-- popovers -->
      <!-- popover reminders -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverReminders"
        :backdrop-dismiss="false"
        @will-dismiss="isOpenPopoverReminders = false"
      >
        <RemindersComponent
          :dates="{
            start: event.reminders.value.start,
            end: event.reminders.value.end,
          }"
          :segment-option="popoverRemindersSegment"
          :notifications="event.reminders.value.notifications"
          :repeat="event.reminders.value.repeat"
          @update-data-reminders="
            event.reminders.value = {
              start: $event.data.start,
              end: $event.data.end,
              notifications: $event.data.remindersChecked,
              repeat: $event.data.dateRepeat,
            }
          "
        />
      </ion-popover>

      <!-- popover timezones -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverTimezones"
        :backdrop-dismiss="false"
      >
        <ion-header mode="ios">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="isOpenPopoverTimezones = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>Zona horaria</ion-title>
          </ion-toolbar>

          <ion-toolbar>
            <ion-searchbar
              :debounce="500"
              show-cancel-button="focus"
              @ion-input="filterZones($event.target.value as string)"
              @ion-cancel="filteredZones.length = 0"
              @ion-clear="filteredZones.length = 0"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div v-if="filteredZones.length == 0">
            <ion-item
              v-for="(timezoneElement, index) in timeZones"
              :key="index"
              button
              @click="selectZone({ zone: timezoneElement as any })"
              ><ion-label>{{ timezoneElement }}</ion-label></ion-item
            >
          </div>

          <!-- search time zone -->
          <div v-if="filteredZones.length > 0">
            <ion-item
              v-for="(timezoneElement, index) in filteredZones"
              :key="index"
              button
              @click="selectZone({ zone: timezoneElement })"
              ><ion-label>{{ timezoneElement }}</ion-label></ion-item
            >
          </div>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useSystem } from "@/composables/useSystem";
import {
  TaskReminderNotification,
  TaskReminderRepeat,
} from "@/utils/interfaces";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonTextarea,
  IonPopover,
  modalController,
} from "@ionic/vue";
import { format } from "date-fns";
import {
  closeOutline,
  globeOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import { ref } from "vue";

// components
import RemindersComponent from "./reminders/RemindersComponent.vue";

const pageTitle = "Agregar tarea";
const popoverRemindersSegment = ref("date-start");
const isOpenPopoverReminders = ref(false);
let isOpenPopoverTimezones = ref(false);
const event = {
  name: ref(""),
  description: ref(""),
  reminders: ref({
    start: new Date() as Date,
    end: new Date() as Date,
    notifications: Array<string>(),
    repeat: { type: "daily", frecuency: 1 } as {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    },
  }),
  timezone: ref(Intl.DateTimeFormat().resolvedOptions().timeZone),
  guests: ref(Array<{ email: string }>()),
  availability: ref("available"),
};
const filteredZones = ref(Array<string>());
const timeZones = (Intl as any)
  .supportedValuesOf("timeZone")
  .map((timeZone: string) => timeZone);

// functions
function formatTextNotifications() {
  let text = "";
  const len = event.reminders.value.notifications.length - 1;
  let index = 0;

  event.reminders.value.notifications.forEach((notification) => {
    if (len > index) text += translateNotifications({ notification }) + ", ";
    else text += translateNotifications({ notification });
    index++;
  });
  return text;
}

function formatTextRepeat() {
  const type = event.reminders.value.repeat.type;
  let text = translateRepeat({
    repeat: type,
  });
  const len = event.reminders.value.repeat.daysWeek?.length! - 1;
  let index = 0;
  let days = "";

  event.reminders.value.repeat.daysWeek?.forEach((day) => {
    if (len > index) days += translateDaysWeekRepear({ day }) + ", ";
    else days += translateDaysWeekRepear({ day });
    index++;
  });
  if (days != "") text = `${text}(${days})`;

  return text;
}

function translateNotifications(params: { notification: string }) {
  let notification = params.notification as keyof TaskReminderNotification;

  let result = useSystem().translateEventReminderNotification({
    notificationName: notification,
  });
  return result;
}

function translateDaysWeekRepear(params: { day: string }) {
  let day = params.day as any;

  let result = useSystem().translateDay({
    dayName: day,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateRepeat(params: { repeat: string }) {
  let repeat = params.repeat as keyof TaskReminderRepeat;

  let result = useSystem().translateEventReminderRepeat({
    typeRepeat: repeat,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

const filterZones = (query: string) => {
  filteredZones.value = timeZones.filter((zone: string) =>
    zone.toLowerCase().includes(query.toLowerCase())
  );
};

const selectZone = (params: { zone: string }) => {
  const zone = params.zone;
  event.timezone.value = zone;
  isOpenPopoverTimezones.value = false;
};
</script>
