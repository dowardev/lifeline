<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button :disabled="v$.$invalid" @click="saveEvent()"
            ><ion-icon :icon="saveOutline"></ion-icon
          ></ion-button>

          <ion-button v-if="!isPlatform('desktop')" id="open-modal-calendar"
            ><ion-icon :icon="calendarOutline"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div>
        <section>
          <ion-row>
            <ion-col size-lg="7" size-xl="6">
              <!-- basic -->
              <ion-list>
                <ion-list-header>
                  <ion-label>Basico</ion-label>
                </ion-list-header>

                <!-- name -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="personOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <ion-input
                          ref="inputName"
                          label="Nombre"
                          placeholder="Visita al dentista"
                          label-placement="fixed"
                          fill="outline"
                          autocomplete="on"
                          autocorrect="on"
                          type="text"
                          :error-text="v$.event.name.$errors[0]?.$message as string"
                          :class="[
                            v$.event.name.$errors.length == 0
                              ? 'ion-valid'
                              : 'ion-invalid',
                          ]"
                          :value="event.name.value"
                          @ion-input="
                            event.name.value = $event.target.value as string
                          "
                          @ion-focus="
                            ($refs.inputName as any).$el.classList.add(
                              'ion-touched'
                            );
                            v$.event.name.$touch();
                          "
                        ></ion-input>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>

                <br />

                <!-- description -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div>
                        <div
                          style="
                            display: flex;
                            align-items: center;
                            height: 50px;
                          "
                        >
                          <ion-button fill="clear" :disabled="true"
                            ><ion-icon :icon="documentTextOutline"></ion-icon
                          ></ion-button>
                        </div>
                      </div>

                      <div style="width: 100%">
                        <ion-textarea
                          placeholder="Visita rutinaria"
                          fill="outline"
                          label="Descripcion"
                          label-placement="fixed"
                          :auto-grow="true"
                          autocomplete="on"
                          autocorrect="on"
                          type="text"
                          :value="event.description.value"
                          @ion-input="
                            event.description.value = $event.target
                              .value as string
                          "
                        ></ion-textarea>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>

                <br />

                <!-- dates -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="globeOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <ion-item
                          fill="outline"
                          lines="none"
                          @click="isOpenPopoverReminders = true"
                        >
                          <ion-label>Tiempo</ion-label>
                          <ion-label slot="end" class="ion-text-wrap"
                            >{{ event.reminders.value.start }} -
                            {{ event.reminders.value.end }}</ion-label
                          >
                        </ion-item>
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
                          fill="outline"
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

              <br />

              <!-- others -->
              <ion-list>
                <ion-list-header>
                  <ion-label>Otros</ion-label>
                </ion-list-header>

                <!-- guests -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div>
                        <div
                          style="
                            display: flex;
                            align-items: center;
                            height: 50px;
                          "
                        >
                          <ion-button fill="clear" :disabled="true"
                            ><ion-icon :icon="peopleOutline"></ion-icon
                          ></ion-button>
                        </div>
                      </div>

                      <div style="width: 100%">
                        <ion-input
                          ref="inputGuest"
                          label="Invitados"
                          label-placement="fixed"
                          fill="outline"
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
                          @ion-input="
                            emailGuest = $event.target.value as string
                          "
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
                          v-for="(guest, indexGuest) in guests"
                          :key="indexGuest"
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
                          style="
                            display: flex;
                            align-items: center;
                            height: 50px;
                          "
                        >
                          <ion-button
                            fill="clear"
                            :disabled="
                              emailGuest.match(regexValidations.email)
                                ? false
                                : true
                            "
                            @click="addGuest()"
                            ><ion-icon :icon="addOutline"></ion-icon
                          ></ion-button>
                        </div>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>

                <br />

                <!-- availability -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="briefcaseOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <ion-item>
                          <ion-select
                            placeholder="Disponibilidad"
                            ok-text="Confirmar"
                            cancel-text="Cancelar"
                            :value="event.availability.value"
                            @ion-change="
                              event.availability.value = $event.target
                                .value as string
                            "
                          >
                            <ion-select-option value="available"
                              >Disponible</ion-select-option
                            >
                            <ion-select-option value="unavailable"
                              >Ocupado</ion-select-option
                            >
                          </ion-select>
                        </ion-item>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-list>
            </ion-col>
          </ion-row>
        </section>

        <!-- calendar component -->
        <section v-if="isPlatform('desktop')">
          <div
            style="
              height: 90vh;
              overflow: auto;
              overflow-x: auto;
              position: fixed;
              top: 11vh;
              right: 0;
              max-width: 40%;
            "
            class="ion-padding hidde-scroll"
          >
            <CalendarComponent />
          </div>
        </section>
      </div>

      <!-- popovers -->
      <!-- popover reminders -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverReminders"
        @will-dismiss="isOpenPopoverReminders = false"
      >
        <RemindersComponent
          @reminders="
            event.reminders.value = {
              start: $event.data.start,
              end: $event.data.end,
            }
          "
        />
      </ion-popover>

      <!-- popover timezones -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverTimezones"
        @will-dismiss="isOpenPopoverTimezones = false"
      >
        <ion-header
          :translucent="true"
          collapse="fade"
          mode="ios"
          class="ion-no-border"
        >
          <ion-toolbar>
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
              v-for="(timezone, index) in timeZones"
              :key="index"
              button
              @click="selectZone({ zone: timezone })"
              ><ion-label>{{ timezone }}</ion-label></ion-item
            >
          </div>

          <!-- search time zone -->
          <div v-if="filteredZones.length > 0">
            <ion-item
              v-for="(timezone, index) in filteredZones"
              :key="index"
              button
              @click="selectZone({ zone: timezone })"
              ><ion-label>{{ timezone }}</ion-label></ion-item
            >
          </div>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->

      <!-- modals -->
      <ion-modal trigger="open-modal-calendar">
        <ion-header :translucent="true" class="ion-no-border" mode="ios">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="modalController.dismiss()"
                ><ion-icon :icon="closeOutline"></ion-icon
              ></ion-button>
            </ion-buttons>

            <ion-title>Calendario</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <CalendarComponent />
        </ion-content>
      </ion-modal>
      <!-- end modals -->
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
  IonRow,
  IonCol,
  IonInput,
  IonButton,
  IonPopover,
  IonSearchbar,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  isPlatform,
  IonItem,
  IonLabel,
  IonModal,
  modalController,
} from "@ionic/vue";
import { defineComponent, ref, watch } from "vue";
import RemindersComponent from "../reminders/RemindersComponent.vue";
import { format } from "date-fns";
import {
  addOutline,
  briefcaseOutline,
  calendarOutline,
  closeOutline,
  createOutline,
  documentTextOutline,
  globeOutline,
  peopleOutline,
  personOutline,
  saveOutline,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import CalendarComponent from "./calendar/CalendarComponent.vue";
import { openToast } from "@/services/system";
import useVuelidate from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";

export default defineComponent({
  name: "EventComponent",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonRow,
    IonCol,
    IonInput,
    IonButton,
    RemindersComponent,
    IonPopover,
    IonSearchbar,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonList,
    IonListHeader,
    CalendarComponent,
    IonItem,
    IonLabel,
    IonModal,
  },

  setup() {
    const isOpenPopoverReminders = ref(false);
    const timeZones = Intl.supportedValuesOf("timeZone").map(
      (timeZone) => timeZone
    );
    const isOpenPopoverTimezones = ref(false);
    const filteredZones = ref(Array<string>());
    const showButtonsOptionGuest = ref(-1);

    // vars
    const name = ref("");
    const description = ref("");
    const reminders = ref({
      start: format(new Date(), "Pp"),
      end: format(new Date(), "Pp"),
    });
    const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const guests = ref(Array<{ email: string }>());
    const availability = ref("");
    const repeats: string[] = [];
    const emailGuest = ref("");

    // event
    const event = {
      name,
      description,
      reminders,
      timezone,
      guests,
      availability,
      repeats,
    };

    // validation
    const regexValidations = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      required: /^\s*$/,
    };
    const messageError = {
      email: "Correo electronico no valido",
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
    const v$ = useVuelidate(rules, { event });
    const v2$ = useVuelidate(rulesGuest, { emailGuest });

    // inputs
    const inputName = ref(null);
    const inputGuest = ref(null);

    return {
      pageTitle: "Agregar evento",
      isOpenPopoverReminders,
      timeZones,
      isOpenPopoverTimezones,
      filteredZones,
      addOutline,
      guests,
      showButtonsOptionGuest,
      createOutline,
      trashOutline,
      personOutline,
      documentTextOutline,
      globeOutline,
      timeOutline,
      peopleOutline,
      briefcaseOutline,
      isPlatform,
      calendarOutline,
      modalController,
      closeOutline,
      saveOutline,
      event,
      emailGuest,
      regexValidations,
      messageError,
      inputName,
      inputGuest,
      v$,
      v2$,
    };
  },

  methods: {
    filterZones(query: string) {
      this.filteredZones = this.timeZones.filter((zone: string) =>
        zone.toLowerCase().includes(query.toLowerCase())
      );
    },

    selectZone(params: { zone: string }) {
      const zone = params.zone;
      this.event.timezone.value = zone;
      this.isOpenPopoverTimezones = false;
    },

    addGuest() {
      const email = this.emailGuest.valueOf();
      this.event.guests.value.push({ email });
      this.emailGuest = "";
    },

    removeGuest(params: { index: number }) {
      const index = params.index;
      this.event.guests.value.splice(index, 1);
    },

    saveEvent() {
      const event = JSON.parse(JSON.stringify(this.event));
    },
  },
});
</script>

<style scoped>
.hidde-scroll::-webkit-scrollbar {
  display: none;
}
</style>
