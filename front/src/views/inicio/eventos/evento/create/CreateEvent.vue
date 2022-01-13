<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-item>
            <ion-label position="floating">Titulo</ion-label>
            <ion-input type="text" v-model="form.title"></ion-input>
          </ion-item>

          <ion-row>
            <ion-col size="12" size-lg="8" size-xl="6">
              <ion-card v-if="optionsElement[0].dateTime.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Horario</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].dateTime.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item button @click="selectTime()" lines="none">
                    <ion-label>
                      <p>
                        {{
                          formatDateTime(form.datetime.start, "P") +
                          " " +
                          formatDateTime(form.datetime.start, "p")
                        }}
                      </p>
                      <p>
                        {{
                          formatDateTime(form.datetime.end, "P") +
                          " " +
                          formatDateTime(form.datetime.end, "p")
                        }}
                      </p>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].reminders.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Recordatorio(s)</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].reminders.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item button @click="selectReminders()" lines="none">
                    <div v-for="reminder in form.reminders" :key="reminder">
                      <ion-chip color="primary">
                        <ion-label>{{ reminder }}</ion-label>
                      </ion-chip>
                    </div>
                  </ion-item>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].repeats.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Repetir</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].repeats.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item button @click="selectRepeat()" lines="none">
                    <ion-label>
                      <p>
                        {{ form.repeats.frecuencyName }}
                      </p>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].calendar.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Calendario</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].calendar.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item lines="none">
                    <ion-select
                      interface="alert"
                      ok-text="Aceptar"
                      cancel-text="Cancelar"
                      v-model="form.calendar"
                    >
                      <ion-select-option value="personal"
                        >Personal</ion-select-option
                      >
                    </ion-select>
                  </ion-item>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].notes.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Notas</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].notes.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item lines="none">
                    <ion-textarea
                      type="text"
                      v-model="form.notes"
                      autoGrow
                      :rows="4"
                    ></ion-textarea>
                  </ion-item>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].tags.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Etiquetas</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].tags.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item
                    v-for="(tag, index) in form.tags"
                    :key="tag"
                    lines="inset"
                  >
                    <ion-input
                      type="text"
                      @ionBlur="updateTag(index, $event.target.value)"
                      :value="tag"
                    ></ion-input>
                    <ion-button fill="clear" @click="removeTag(index)">
                      <ion-icon :icon="closeCircleOutline"></ion-icon>
                    </ion-button>
                  </ion-item>
                  <ion-button fill="clear" expand="full" @click="addTag()"
                    ><ion-icon :icon="addOutline"></ion-icon
                  ></ion-button>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].task.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Tareas</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].task.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item v-for="(task, index) in form.tasks" :key="task">
                    <ion-input
                      type="text"
                      @ionBlur="updateTask(index, $event.target.value)"
                      :value="task"
                    ></ion-input>
                    <ion-button fill="clear" @click="removeTask(index)">
                      <ion-icon :icon="closeCircleOutline"></ion-icon>
                    </ion-button>
                  </ion-item>
                  <ion-button fill="clear" expand="full" @click="addTask()"
                    ><ion-icon :icon="addOutline"></ion-icon
                  ></ion-button>
                </ion-list>
              </ion-card>

              <ion-card v-if="optionsElement[0].khanban.selected">
                <ion-list>
                  <ion-list-header>
                    <ion-label>Khanban</ion-label>
                    <ion-button
                      fill="clear"
                      @click="optionsElement[0].khanban.selected = false"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon
                    ></ion-button>
                  </ion-list-header>
                  <ion-item
                    v-for="(khanban, index) in form.khanban"
                    :key="khanban"
                    lines="inset"
                  >
                    <ion-input
                      type="text"
                      @ionBlur="updateKhanbanCard(index, $event.target.value)"
                      :value="khanban"
                    ></ion-input>
                    <ion-button fill="clear" @click="removeKhanbanCard(index)">
                      <ion-icon :icon="closeCircleOutline"></ion-icon>
                    </ion-button>
                  </ion-item>
                  <ion-button
                    fill="clear"
                    expand="full"
                    @click="addKhanbanCard()"
                    ><ion-icon :icon="addOutline"></ion-icon
                  ></ion-button>
                </ion-list>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-lg="4" size-xl="6">
              <ion-list>
                <ion-list-header>
                  <ion-label>Opciones</ion-label>
                </ion-list-header>
                <div
                  v-for="element in optionsElement[0]"
                  :key="element"
                  style="display: inline-block"
                >
                  <div v-if="element.selected == false">
                    <ion-chip @click="element.selected = true" color="primary">
                      <ion-label color="secondary">{{
                        element.name
                      }}</ion-label>
                    </ion-chip>
                  </div>
                </div>
              </ion-list>
            </ion-col>
          </ion-row>
        </ion-col>
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  toastController,
  loadingController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  saveOutline,
  closeCircleOutline,
  addOutline,
  closeOutline,
} from "ionicons/icons";
import eventBus from "../../../../../EventBus";
import eventsService from "../../../../../services/event.vue";
import userService from "../../../../../services/user.vue";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";

export default defineComponent({
  name: "Evento",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonTextarea,
    IonSelect,
  },
  setup() {
    return {
      chevronBackOutline,
      saveOutline,
      IonInput,
      IonSelectOption,
      closeCircleOutline,
      addOutline,
      closeOutline,
    };
  },
  data() {
    const pageTitle = "Agregar elemento";
    const storage = new Storage();
    storage.create();
    const today = new Date().toLocaleString("sv").replace(" ", "T");
    return {
      buttonEdit: true,
      pageTitle,
      storage,
      form: {
        title: "",
        datetime: {
          start: today,
          end: new Date(add(new Date(), { days: 1 }))
            .toLocaleString("sv")
            .replace(" ", "T"),
        },
        reminders: [],
        repeats: {
          frecuencyName: "",
          frecuency: "",
          data: {},
        },
        calendar: "",
        notes: "",
        tags: [] as Array<string>,
        tasks: [] as Array<string>,
        khanban: [] as Array<string>,
      },
      optionsElement: [
        {
          dateTime: { name: "Fecha", selected: false },
          reminders: { name: "Recordatorios", selected: false },
          repeats: { name: "Repetir", selected: false },
          calendar: { name: "Calendario", selected: false },
          notes: { name: "Notas", selected: false },
          tags: { name: "Etiquetas", selected: false },
          task: { name: "Tareas", selected: false },
          khanban: { name: "Khanban", selected: false },
        },
      ],
    };
  },
  mounted() {
    if (this.$route.params.id) {
      this.pageTitle = "Actualizar evento";
      this.getEventLocal(parseInt(this.$route.params.id as string));
    }
    eventBus().emitter.on("set-schedule-event", (response: any) => {
      this.form.datetime.start = response.dateTimeStart;
      this.form.datetime.end = response.dateTimeEnd;
    });
    eventBus().emitter.on("set-reminder-event", (response: any) => {
      this.form.reminders = response.reminders;
    });
    eventBus().emitter.on("set-repeat-event", async (response: any) => {
      this.form.repeats.frecuencyName = await userService().translate(
        response.frecuency
      );
      this.form.repeats.frecuency = response.frecuency;
      this.form.repeats.data = response.data;
    });
    eventBus().emitter.on("update-event", async (response: any) => {
      // console.log(response.event);
      // this.event = response.event;
      //this.pageTitle = "Actualizar evento";
      //  this.getEvent();
    });
  },
  methods: {
    editEvent() {
      this.buttonEdit = !this.buttonEdit;
    },
    selectTime() {
      this.$router.push("/horario");
      setTimeout(() => {
        eventBus().emitter.emit("get-schedule-event", {
          dateTimeStart: this.form.datetime.start,
          dateTimeEnd: this.form.datetime.end,
        });
      }, 300);
    },
    selectRepeat() {
      this.$router.push("/repetir");
      setTimeout(() => {
        eventBus().emitter.emit("get-repeat-event", {
          reminders: JSON.parse(JSON.stringify(this.form.repeats)),
        });
      }, 300);
    },
    selectReminders() {
      this.$router.push("/recordatorios");
      setTimeout(() => {
        eventBus().emitter.emit("get-reminder-event", {
          reminders: JSON.parse(JSON.stringify(this.form.reminders)),
        });
      }, 300);
    },
    async save() {
      if (this.form.title == "") {
        this.$router.go(-1);
        return;
      }
      const event = {
        id: 0,
        title: "",
        dateTime: {},
        reminders: [],
        repeats: {},
        calendar: "",
        notes: "",
        tags: {},
        tasks: {},
        khanban: {},
      };

      event.title = this.form.title;

      if (this.optionsElement[0].dateTime.selected) {
        event.dateTime = {
          start: {
            date: new Date(this.form.datetime.start)
              .toISOString()
              .split("T")[0],
            time: new Date(this.form.datetime.start)
              .toISOString()
              .split("T")[1]
              .replace("Z", ""),
          },
          end: {
            date: new Date(this.form.datetime.end).toISOString().split("T")[0],
            time: new Date(this.form.datetime.end)
              .toISOString()
              .split("T")[1]
              .replace("Z", ""),
          },
        };
      }

      if (this.optionsElement[0].reminders.selected) {
        event.reminders = this.form.reminders;
      }

      if (this.optionsElement[0].repeats.selected) {
        event.repeats = {
          frecuency: this.form.repeats.frecuency,
          data: this.form.repeats.data,
        };
      }

      if (this.optionsElement[0].calendar.selected) {
        event.calendar = this.form.calendar;
      }

      if (this.optionsElement[0].notes.selected) {
        event.notes = this.form.notes;
      }

      if (this.optionsElement[0].tags.selected) {
        event.tags = this.form.tags;
      }

      if (this.optionsElement[0].task.selected) {
        event.tasks = this.form.tasks;
      }

      if (this.optionsElement[0].khanban.selected) {
        event.khanban = this.form.khanban;
      }

      for (let i in event) {
        if (
          Object.keys((event as any)[i]).length == 0 ||
          (event as any)[i] == ""
        ) {
          delete (event as any)[i];
        }
      }

      if (this.$route.params.id) {
        event.id = parseInt(this.$route.params.id as string);
        this.updateEvent(event);
      } else {
        this.createEvent(event);
      }
    },
    async createEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      loading.present();

      eventsService()
        .createEvent(event)
        .then(async (response) => {
          loading.dismiss();
          const message = await userService()
            .translate("saveEvent")
            .then((response) => {
              return response;
            });
          eventBus().emitter.emit("new-element");
          this.$router.go(-1);
          this.openToast(message, "success");
        });
    },
    async updateEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      loading.present();

      eventsService()
        .updateEvent(event)
        .then(async (response) => {
          loading.dismiss();
          const message = await userService()
            .translate("updateEvent")
            .then((response) => {
              return response;
            });
          eventBus().emitter.emit("update-event-success");
          this.$router.go(-1);
          this.openToast(message, "success");
        });
    },
    async getEventLocal(id: number) {
      const event = await eventsService()
        .getEventLocal(id)
        .then((response) => {
          return response;
        });

      if (event.length) {
        event.forEach(async (element: any) => {
          this.form.title = element.title;

          // let date = this.formatDate(element.time_start);
          // this.timeStart.text = date.dateFormatted;
          // this.timeStart.value = element.time_start;
          // date = this.formatDate(element.time_end);
          // this.timeEnd.text = date.dateFormatted;
          // this.timeEnd.value = element.time_start;

          this.form.reminders = element.reminders;

          element.repeats.frecuencyName = await userService().translate(
            element.repeats.frecuency
          );
          this.form.repeats = element.repeats;

          this.form.calendar = element.calendar;

          this.form.notes = element.notes;
        });
      }
    },
    formatDateTime(date: string, typeFormat: string) {
      return eventsService().formatDateTime(date, typeFormat);
    },
    async openToast(message: string, color: string) {
      const toast = await toastController.create({
        message,
        duration: 2000,
        mode: "ios",
        translucent: true,
        color,
      });
      return toast.present();
    },
    addTag() {
      this.form.tags.push("");
    },
    removeTag(index: number) {
      this.form.tags.splice(index, 1);
    },
    updateTag(index: number, value: string) {
      this.form.tags[index] = value;
    },
    addTask() {
      this.form.tasks.push("");
    },
    removeTask(index: number) {
      this.form.tasks.splice(index, 1);
    },
    updateTask(index: number, value: string) {
      this.form.tasks[index] = value;
    },
    addKhanbanCard() {
      this.form.khanban.push("");
    },
    removeKhanbanCard(index: number) {
      this.form.khanban.splice(index, 1);
    },
    updateKhanbanCard(index: number, value: string) {
      this.form.khanban[index] = value;
    },
    async presentLoading() {
      const loading = await loadingController.create({
        cssClass: "my-custom-class",
        message: "Espera por favor",
      });
      return loading;
    },
  },
});
</script>
