<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="modalController.dismiss()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button :disabled="v$.$invalid" @click="save()"
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
                  ref="inputName"
                  label="Titulo"
                  label-placement="floating"
                  fill="solid"
                  :error-text="v$.task.name.$errors[0]?.$message as string"
                  :class="[
                    v$.task.name.$errors.length == 0
                      ? 'ion-valid'
                      : 'ion-invalid',
                  ]"
                  :value="task.name.value"
                  @ion-input="task.name.value = $event.detail.value as string"
                  @ion-focus="
                    ($refs.inputName as any).$el.classList.add('ion-touched');
                    v$.task.name.$touch();
                  "
                ></ion-input>

                <br />

                <ion-textarea
                  label="Descripcion"
                  label-placement="floating"
                  fill="solid"
                  :value="task.description.value"
                  @ion-input="
                    task.description.value = $event.detail.value as string
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
                      @ion-input="subTask = $event.detail.value as string"
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
                        'Pp',
                      ) +
                      '\n' +
                      format(
                        new Date(task.reminders.value.end ?? new Date()),
                        'Pp',
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
                      :error-text="
                        v2$.emailGuest.$errors[0]?.$message as string
                      "
                      :class="[
                        v2$.emailGuest.$errors.length == 0
                          ? 'ion-valid'
                          : 'ion-invalid',
                      ]"
                      :value="emailGuest"
                      @ion-input="emailGuest = $event.detail.value as string"
                      @ion-focus="
                        ($refs.inputGuest as any).$el.classList.add(
                          'ion-touched',
                        )
                      "
                      @ion-blur="
                        ($refs.inputGuest as any).$el.classList.remove(
                          'ion-touched',
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
                        :disabled="emailGuest.trim() === ''"
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
        @will-dismiss="resetTimeZones()"
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
              :value="searchTimeZone"
              @ion-input="
                searchTimeZone = $event.detail.value as string;
                filterZones({ query: searchTimeZone });
              "
              @ion-cancel="clearTimeZones()"
              @ion-clear="clearTimeZones()"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div v-if="filteredZones.length == 0">
            <ion-accordion-group>
              <ion-accordion
                v-for="group in timeZoneGroups"
                :key="group.header"
                :value="group.header"
              >
                <ion-item slot="header">
                  <ion-label>{{ group.header }}</ion-label>
                </ion-item>
                <div slot="content">
                  <ion-item
                    v-for="zone in group.zones"
                    :key="zone"
                    button
                    @click="selectZone({ zone })"
                    ><ion-label>{{
                      getTimeZoneLabel(zone)
                    }}</ion-label></ion-item
                  >
                </div>
              </ion-accordion>
            </ion-accordion-group>
          </div>

          <!-- search time zone -->
          <div v-if="filteredZones.length > 0">
            <ion-item
              v-for="zone in filteredZones"
              :key="zone"
              button
              @click="selectZone({ zone })"
              ><ion-label>{{ getTimeZoneLabel(zone) }}</ion-label></ion-item
            >
          </div>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonAccordion,
  IonAccordionGroup,
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
import { email, helpers, maxLength, required } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";

// 2. Controllers / Composables
import { SystemController } from "@/controllers/systemController";
import { TaskController } from "@/controllers/taskController";
import { useAuthStore } from "@/store/authStore";
import { useReminder } from "@/composables/useReminder";
import {
  normalizeOffsetCodes,
  translateReminderOffset,
} from "@/utils/reminders";
import { NotificationPermissionError } from "@/controllers/reminderController";
const systemController = new SystemController();
const taskController = new TaskController();
const authStore = useAuthStore();

// 3. Components
import RemindersComponent from "./reminders/RemindersComponent.vue";

// 4. Interface and types imports
import type { Task, TaskReminderRepeat } from "@/utils/interfaces";
import type { TaskItem } from "@/store/taskStore";

// 5. Main (props, emits)
const props = defineProps({
  taskData: { type: Object as () => Task, default: () => null },
});

// 6. Vars and const
const pageTitle = ref("Agregar tarea");
const popoverRemindersSegment = ref("date-start");
const isOpenPopoverReminders = ref(false);
const isOpenPopoverTimezones = ref(false);
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
const searchTimeZone = ref("");
const timeZoneNames = systemController.getTimeZoneNames();
const timeZoneGroups = systemController.groupTimeZones(timeZoneNames);
const getTimeZoneLabel = systemController.getTimeZoneLabel;
const emailGuest = ref("");
const showButtonsOptionGuest = ref(-1);
const subTask = ref("");
const showButtonsOptionSubtask = ref(-1);

const messageError = {
  email: "Correo electrónico no valido",
  required: "Campo requerido",
  maxLength: "Máximo 255 caracteres",
};
const rulesGuest = {
  emailGuest: {
    required: helpers.withMessage(messageError.required, required),
    email: helpers.withMessage(messageError.email, email),
  },
};
const v2$ = useVuelidate(rulesGuest, { emailGuest });

const rules = {
  task: {
    name: {
      required: helpers.withMessage(messageError.required, required),
      maxLength: helpers.withMessage(messageError.maxLength, maxLength(255)),
    },
  },
};
const v$ = useVuelidate(rules, { task });
const inputName = ref(null);

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
onMounted(async () => {
  if (props.taskData) {
    pageTitle.value = "Actualizar tarea";
    setTask({ task: props.taskData });
  }
});

// 10. Functions (named parameters pattern)
function formatTextNotifications(): string {
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

function formatTextRepeat(): string {
  const type = task.reminders.value.repeat.type;
  let text = translateRepeat({
    repeat: type,
  });
  const len = (task.reminders.value.repeat.daysWeek?.length ?? 0) - 1;
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

function translateNotifications(params: { notification: string }): string {
  return translateReminderOffset(params.notification);
}

function translateDaysWeekRepear(params: { day: string }): string {
  const day = params.day as any;

  let result = systemController.translateDay({
    dayName: day,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateRepeat(params: { repeat: string }): string {
  const repeat = params.repeat as keyof TaskReminderRepeat;

  let result = systemController.translateEventReminderRepeat({
    typeRepeat: repeat,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function filterZones(params: { query: string }): void {
  const { query } = params;
  filteredZones.value = timeZoneNames.filter((name: string) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );
}

function selectZone(params: { zone: string }): void {
  const zone = params.zone;
  task.timezone.value = zone;
  isOpenPopoverTimezones.value = false;
}

function clearTimeZones(): void {
  searchTimeZone.value = "";
  filteredZones.value = [];
}

function resetTimeZones(): void {
  isOpenPopoverTimezones.value = false;
  clearTimeZones();
}

function removeGuest(params: { index: number }): void {
  const index = params.index;
  task.guests.value.splice(index, 1);
}

function addGuest(): void {
  const email = emailGuest.value.trim();
  if (!email) return;
  if (!Array.isArray(task.guests.value)) task.guests.value = [];
  task.guests.value.push({ email });
  emailGuest.value = "";
}
function addSubtask(): void {
  const taskElement = subTask.value;
  task.subtasks.value.push({ name: taskElement, checked: false });
  subTask.value = "";
}

function removeSubTask(params: { index: number }): void {
  const index = params.index;
  task.subtasks.value.splice(index, 1);
}

function setTask(params: { task: Task }): void {
  const { task: taskData } = params;
  task.name.value = taskData.name!;
  task.description.value = taskData.description ?? "";
  task.reminders.value.start = taskData.reminders!.start;
  task.reminders.value.end = taskData.reminders!.end;
  task.reminders.value.notifications = taskData.reminders!.notifications ?? [];
  task.reminders.value.repeat = taskData.reminders!.repeat;
  task.timezone.value = taskData.timezone!;
  task.guests.value = Array.isArray(taskData.guests) ? taskData.guests : [];
  task.subtasks.value = taskData.subtasks ?? Array<any>();
}

async function save(): Promise<void> {
  try {
    const canonical = normalizeOffsetCodes(task.reminders.value.notifications);
    const dueDate = task.reminders.value.start
      ? new Date(task.reminders.value.start)
      : null;
    const taskId = props.taskData?.id;

    // Anonymous mode: persist locally (server unavailable), schedule reminders.

    // Request notification permission synchronously within the user gesture
    // (before any network await below) or Capacitor/Chrome rejects it.
    await useReminder()
      .checkNotificationsPermissions()
      .catch(() => undefined);

    if (authStore.isAnonymous) {
      const editingId = props.taskData?.id ? Number(props.taskData.id) : null;
      const localId = editingId ?? -Date.now();
      const previousIds =
        (props.taskData as unknown as { id_reminders?: number[] })
          .id_reminders ?? [];

      // Cancel any previously scheduled reminders for this local task
      // BEFORE scheduling the new set (cancel-then-schedule).
      try {
        if (previousIds.length) {
          await useReminder().cancelTaskReminders({ ids: previousIds });
        }
      } catch (error) {
        if (!(error instanceof NotificationPermissionError)) throw error;
      }

      const localTask: TaskItem = {
        id: localId,
        user_id: authStore.localUser?.id ?? 0,
        title: task.name.value,
        name: task.name.value,
        description: task.description.value,
        status: "pending",
        checked: false,
        kanban: { columnName: "pending", position: 0 },
        priority: 0,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        subtasks: "",
        notifications: canonical,
        id_reminders: [] as number[],
      };

      let ids: number[] = [];
      try {
        const result = await useReminder().scheduleTaskReminders({
          taskId: localId,
          title: task.name.value,
          message: task.description.value,
          dueDate: dueDate ?? new Date(),
          notifications: canonical,
          existingIds: [],
        });
        ids = result.ids;
      } catch (error) {
        if (!(error instanceof NotificationPermissionError)) throw error;
      }
      localTask.id_reminders = ids;

      if (editingId) {
        await taskController.updateTask({ id: editingId, task: localTask });
      } else {
        await taskController.addLocalTask({ task: localTask });
      }
      closePage();
      return;
    }

    if (!taskId) {
      const serverTask = await taskController.createTask({
        title: task.name.value,
        description: task.description.value,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        notifications: canonical,
        id_reminders: [],
      });
      const serverId = serverTask.id;

      let ids: number[] = [];
      try {
        const result = await useReminder().scheduleTaskReminders({
          taskId: serverId,
          title: task.name.value,
          message: task.description.value,
          dueDate: dueDate ?? new Date(),
          notifications: canonical,
          existingIds: [],
        });
        ids = result.ids;
      } catch (error) {
        if (!(error instanceof NotificationPermissionError)) throw error;
      }

      await taskController.updateTask({ id: serverId, id_reminders: ids });
    } else {
      const existingIds =
        (props.taskData as unknown as { id_reminders?: number[] })
          .id_reminders ?? [];

      await updateTaskWithReminders({
        dueDate,
        notifications: canonical,
        id_reminders: existingIds,
      });

      if (task.reminders.value.start) {
        let ids: number[] = [];
        try {
          const result = await useReminder().scheduleTaskReminders({
            taskId,
            title: task.name.value,
            message: task.description.value,
            dueDate: dueDate ?? new Date(),
            notifications: canonical,
            existingIds,
          });
          ids = result.ids;
        } catch (error) {
          if (!(error instanceof NotificationPermissionError)) throw error;
        }
        await taskController.updateTask({
          id: Number(taskId),
          id_reminders: ids,
        });
      } else {
        try {
          await useReminder().cancelTaskReminders({ ids: existingIds });
        } catch (error) {
          if (!(error instanceof NotificationPermissionError)) throw error;
        }
        await taskController.updateTask({
          id: Number(taskId),
          id_reminders: [],
        });
      }
    }

    closePage();
  } catch (error) {
    console.error(error);
  }
}

async function updateTaskWithReminders(params: {
  dueDate: Date | null;
  notifications: string[];
  id_reminders: number[];
}): Promise<void> {
  const { dueDate, notifications, id_reminders } = params;

  const taskFormated = {
    id: props.taskData?.id,
    title: task.name.value,
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
    due_date: dueDate ? dueDate.toISOString() : undefined,
    notifications,
    id_reminders,
  };

  await taskController.updateTask({
    id: props.taskData?.id ? Number(props.taskData.id) : undefined,
    task: JSON.parse(JSON.stringify(taskFormated)),
  });
}
async function closePage(): Promise<void> {
  await modalController.dismiss();
}
</script>
