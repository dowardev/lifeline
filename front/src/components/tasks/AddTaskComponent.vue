<template>
  <ion-page>
    <ion-header  mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="modalController.dismiss()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button @click="save()"
            ><ion-icon :icon="saveOutline"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- basic -->
      <ion-row class="center">
        <ion-col size-xs="12" size-md="10" size-lg="6">
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
                  :value="task.name.value"
                  @ion-input="task.name.value = $event.target.value as string"
                ></ion-input>

                <br />

                <ion-textarea
                  label="Descripcion"
                  label-placement="floating"
                  fill="solid"
                  :value="task.description.value"
                  @ion-input="
                    task.description.value = $event.target.value as string
                  "
                ></ion-textarea>
              </ion-col>
            </ion-row>

            <!-- subtasks -->
            <ion-row class="ion-padding">
              <ion-col size="12">
                <div style="display: flex">
                  <div style="width: 100%">
                    <ion-input
                      label="Subtareas"
                      label-placement="floating"
                      fill="solid"
                      autocomplete="on"
                      autocorrect="on"
                      type="text"
                      :value="subTask"
                      @ion-input="subTask = $event.target.value as string"
                    ></ion-input>

                    <!-- list subtasks -->
                    <ion-item
                      v-for="(taskElement, indexTask) in task.subtasks.value"
                      :key="indexTask"
                      lines="full"
                      @mouseenter="showButtonsOptionSubtask = indexTask"
                      @mouseleave="showButtonsOptionSubtask = -1"
                    >
                      <ion-checkbox justify="start" label-placement="end">{{
                        taskElement.name
                      }}</ion-checkbox>

                      <ion-button
                        v-if="showButtonsOptionSubtask === indexTask"
                        fill="clear"
                        color="danger"
                        @click="removeSubTask({ index: indexTask })"
                        ><ion-icon :icon="trashOutline"></ion-icon
                      ></ion-button>
                    </ion-item>
                  </div>

                  <div>
                    <div
                      style="display: flex; align-items: center; height: 50px"
                    >
                      <ion-button
                        fill="clear"
                        :disabled="!subTask"
                        @click="addSubtask()"
                        ><ion-icon :icon="addOutline"></ion-icon
                      ></ion-button>
                    </div>
                  </div>
                </div>
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-col>
      </ion-row>

      <!-- time -->
      <ion-row class="center">
        <ion-col size-xs="12" size-md="10" size-lg="6">
          <ion-list>
            <ion-list-header>
              <ion-label>Tiempo</ion-label>
              <ion-button
                v-if="task.reminders.value.start == null"
                @click="
                  popoverRemindersSegment = 'date-start';
                  isOpenPopoverReminders = true;
                "
                >Agregar tiempo</ion-button
              >
              <ion-button
                v-if="task.reminders.value.start != null"
                @click="
                  task.reminders.value.start = null;
                  task.reminders.value.end = null;
                "
                >Quitar tiempo</ion-button
              >
            </ion-list-header>

            <section v-if="task.reminders.value.start != null">
              <ion-row class="ion-padding">
                <ion-col>
                  <!-- dates -->
                  <ion-textarea
                    label="Tiempo"
                    label-placement="floating"
                    fill="solid"
                    :value="
                      format(
                        new Date(task.reminders.value.start ?? new Date()),
                        'Pp'
                      ) +
                      '\n' +
                      format(
                        new Date(task.reminders.value.end ?? new Date()),
                        'Pp'
                      )
                    "
                    @click="
                      popoverRemindersSegment = 'date-start';
                      isOpenPopoverReminders = true;
                    "
                  ></ion-textarea>

                  <!-- notifications -->
                  <section v-if="task.reminders.value.notifications.length > 0">
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
                  <section v-if="task.reminders.value.repeat">
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
                </ion-col>
              </ion-row>

              <!-- time zone -->
              <ion-row class="ion-padding">
                <ion-col>
                  <ion-item
                    fill="solid"
                    lines="none"
                    @click="isOpenPopoverTimezones = true"
                  >
                    <ion-label>Zona horaria</ion-label>
                    <ion-label slot="end" class="ion-text-wrap"
                      >{{ task.timezone.value }}
                    </ion-label>
                  </ion-item>
                </ion-col>
              </ion-row>
            </section>
          </ion-list>
        </ion-col>
      </ion-row>

      <ion-row class="center">
        <ion-col size-xs="12" size-md="10" size-lg="6">
          <ion-list>
            <ion-list-header>
              <ion-label>Extra</ion-label>
            </ion-list-header>

            <!-- collaborators -->
            <ion-row class="ion-padding">
              <ion-col size="12">
                <div style="display: flex">
                  <div style="width: 100%">
                    <ion-input
                      ref="inputGuest"
                      label="Invitados"
                      label-placement="floating"
                      fill="solid"
                      placeholder="Correo electronico"
                      autocomplete="on"
                      autocorrect="on"
                      type="email"
                      :error-text="v2$.emailGuest.$errors[0]?.$message as string"
                      :class="[
                        v2$.emailGuest.$errors.length == 0
                          ? 'ion-valid'
                          : 'ion-invalid',
                      ]"
                      :value="emailGuest"
                      @ion-input="emailGuest = $event.target.value as string"
                      @ion-focus="
                        ($refs.inputGuest as any).$el.classList.add(
                          'ion-touched'
                        )
                      "
                      @ion-blur="
                        ($refs.inputGuest as any).$el.classList.remove(
                          'ion-touched'
                        );
                        v2$.emailGuest.$touch();
                      "
                    ></ion-input>

                    <ion-item
                      v-for="(guest, indexGuest) in task.guests.value"
                      :key="indexGuest"
                      lines="full"
                      @mouseenter="showButtonsOptionGuest = indexGuest"
                      @mouseleave="showButtonsOptionGuest = -1"
                    >
                      <ion-label>{{ guest.email }}</ion-label>

                      <ion-button
                        v-if="showButtonsOptionGuest === indexGuest"
                        fill="clear"
                        color="danger"
                        @click="removeGuest({ index: indexGuest })"
                        ><ion-icon :icon="trashOutline"></ion-icon
                      ></ion-button>
                    </ion-item>
                  </div>

                  <div>
                    <div
                      style="display: flex; align-items: center; height: 50px"
                    >
                      <ion-button
                        fill="clear"
                        :disabled="v2$.$invalid"
                        @click="addGuest()"
                        ><ion-icon :icon="addOutline"></ion-icon
                      ></ion-button>
                    </div>
                  </div>
                </div>
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-col>
      </ion-row>

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
            start: task.reminders.value.start ?? new Date(),
            end: task.reminders.value.end ?? new Date(),
          }"
          :segment-option="popoverRemindersSegment"
          :notifications="task.reminders.value.notifications"
          :repeat="task.reminders.value.repeat"
          @update-data-reminders="
            task.reminders.value = {
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
  Schedule,
  Task,
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
  IonCheckbox,
} from "@ionic/vue";
import { format } from "date-fns";
import {
  addOutline,
  closeOutline,
  saveOutline,
  trashOutline,
} from "ionicons/icons";
import { onMounted, ref } from "vue";
import { email, helpers, required } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";

// components
import RemindersComponent from "./reminders/RemindersComponent.vue";
import { useSchedule } from "@/composables/useSchedule";
import { useTask } from "@/composables/useTask";
import { useReminder } from "@/composables/useReminder";

const props = defineProps({
  taskData: { type: Object as () => Task, default: () => null },
});

// vars
const pageTitle = ref("Agregar tarea");
const popoverRemindersSegment = ref("date-start");
const isOpenPopoverReminders = ref(false);
let isOpenPopoverTimezones = ref(false);
const task = {
  name: ref(""),
  description: ref(""),
  reminders: ref({
    start: new Date() as Date | null,
    end: new Date() as Date | null,
    notifications: Array<string>(),
    repeat: { type: "daily", frecuency: 1 } as {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    },
  }),
  timezone: ref(Intl.DateTimeFormat().resolvedOptions().timeZone),
  guests: ref(Array<{ email: string }>()),
  subtasks: ref(Array<{ name: string; checked: boolean }>()),
};
const filteredZones = ref(Array<string>());
const timeZones = (Intl as any)
  .supportedValuesOf("timeZone")
  .map((timeZone: string) => timeZone);
let emailGuest = ref("");
const showButtonsOptionGuest = ref(-1);
let subTask = ref("");
const showButtonsOptionSubtask = ref(-1);

const messageError = {
  email: "Correo electrónico no valido",
  required: "Campo requerido",
};
const rules = {
  event: {
    name: {
      required: helpers.withMessage(messageError.required, required),
    },
  },
};
const rulesGuest = {
  emailGuest: {
    required: helpers.withMessage(messageError.required, required),
    email: helpers.withMessage(messageError.email, email),
  },
};
const v$ = useVuelidate(rules, { event: task });
const v2$ = useVuelidate(rulesGuest, { emailGuest });

onMounted(async () => {
  if (props.taskData) {
    pageTitle.value = "Actualizar tarea";
    setTask({ task: props.taskData });
  }
});

// functions
function formatTextNotifications() {
  let text = "";
  const len = task.reminders.value.notifications.length - 1;
  let index = 0;

  task.reminders.value.notifications.forEach((notification) => {
    if (len > index) text += translateNotifications({ notification }) + ", ";
    else text += translateNotifications({ notification });
    index++;
  });
  return text;
}

function formatTextRepeat() {
  const type = task.reminders.value.repeat.type;
  let text = translateRepeat({
    repeat: type,
  });
  const len = task.reminders.value.repeat.daysWeek?.length! - 1;
  let index = 0;
  let days = "";

  task.reminders.value.repeat.daysWeek?.forEach((day) => {
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

function filterZones(query: string) {
  filteredZones.value = timeZones.filter((zone: string) =>
    zone.toLowerCase().includes(query.toLowerCase())
  );
}

function selectZone(params: { zone: string }) {
  const zone = params.zone;
  task.timezone.value = zone;
  isOpenPopoverTimezones.value = false;
}

function removeGuest(params: { index: number }) {
  const index = params.index;
  task.guests.value.splice(index, 1);
}

function addGuest() {
  const email = emailGuest.value;
  task.guests.value.push({ email });
  emailGuest.value = "";
}

function addSubtask() {
  const taskElement = subTask.value;
  task.subtasks.value.push({ name: taskElement, checked: false });
  subTask.value = "";
}

function removeSubTask(params: { index: number }) {
  const index = params.index;
  task.subtasks.value.splice(index, 1);
}

function setTask(params: { task: Task }) {
  const { task: taskData } = params;
  task.name.value = taskData.name!;
  task.description.value = taskData.description ?? "";
  task.reminders.value.start = taskData.reminders!.start;
  task.reminders.value.end = taskData.reminders!.end;
  task.reminders.value.notifications = taskData.reminders!.notifications ?? [];
  task.reminders.value.repeat = taskData.reminders!.repeat;
  task.timezone.value = taskData.timezone!;
  task.guests.value = taskData.guests!;
  task.subtasks.value = taskData.subtasks ?? Array<any>();
}

async function save() {
  let taskId = props.taskData?.id;
  let schedule: Schedule = useSchedule().getSchedule() ?? ({} as Schedule);

  try {
    await updateTask();

    if (task.reminders.value.start)
      await postCreateTask({ taskId: taskId, schedule });
    closePage();
  } catch (error) {
    console.error(error);
  }
}

async function updateTask() {
  const taskFormated = {
    id: props.taskData.id,
    name: task.name.value,
    guests: task.guests.value,
    reminders: {
      start: task.reminders.value.start,
      end: task.reminders.value.end,
      notifications: task.reminders.value.notifications,
      repeat: task.reminders.value.repeat,
    },
    description: task.description.value,
    subtasks: task.subtasks.value,
    timezone: task.timezone.value,
  };

  console.log(taskFormated);
  await useTask().updateTask({
    task: JSON.parse(JSON.stringify(taskFormated)),
  });
}

async function postCreateTask(params: { taskId: string; schedule: Schedule }) {
  const { taskId } = params;
  let { schedule } = params;
  const scheduleId = (Math.floor(Math.random() * 900) + 100).toString();

  const scheduleElement = useSchedule().generateScheduleElement({
    id: scheduleId,
    idElement: taskId,
    title: task.name.value,
    message: task.description.value,
    startDate: new Date(task.reminders.value.start!),
    endDate: new Date(task.reminders.value.end!),
    type: "task",
    reminder: task.reminders.value.notifications.length > 0 ? true : false,
    repeat: task.reminders.value.repeat,
  });

  if (taskId)
    schedule = useSchedule().removeElementSchedule({
      id: taskId,
      schedule,
    });

  schedule = useSchedule().generateEventSchedule({
    scheduleElement,
    schedule,
  });
  await useSchedule().saveSchedule({ schedule });
  await useSchedule().loadSchedule();

  const notifications = useReminder().getEventReminders({
    dateStart: task.reminders.value.start!,
    notifications: task.reminders.value.notifications,
  });

  if (notifications) {
    await Promise.all(
      notifications.map(async (notification) => {
        await useSchedule().setReminders({
          id: parseInt(scheduleId),
          reminder: notification,
          title: task.name.value,
          message: task.description.value,
        });
      })
    );
  }
}

async function closePage() {
  await modalController.dismiss();
}
</script>
