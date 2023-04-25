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

        <ion-buttons
          v-if="!isPlatform('desktop')"
          id="open-modal-calendar"
          slot="end"
        >
          <ion-button><ion-icon :icon="calendarOutline"></ion-icon></ion-button>
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
                          label="Nombre"
                          placeholder="Visita al dentista"
                          label-placement="fixed"
                          fill="outline"
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
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="documentTextOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <ion-textarea
                          placeholder="Visita rutinaria"
                          fill="outline"
                          label="Descripcion"
                          label-placement="fixed"
                          :auto-grow="true"
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
                            >{{ reminders.start }} -
                            {{ reminders.end }}</ion-label
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
                          <ion-label>Tiempo</ion-label>
                          <ion-label slot="end" class="ion-text-wrap"
                            >{{ zoneSelected }}
                          </ion-label>
                        </ion-item>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-list>

              <br />

              <!-- others -->
              <ion-list class="last-item">
                <ion-list-header>
                  <ion-label>Otros</ion-label>
                </ion-list-header>

                <!-- guests -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="peopleOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <ion-input
                          label="Invitados"
                          label-placement="fixed"
                          fill="outline"
                          placeholder="Correo electronico"
                        ></ion-input>
                      </div>
                    </div>
                  </ion-col>

                  <ion-col size-xs="11" size="10" style="padding-left: 12%">
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
                        ><ion-icon :icon="createOutline"></ion-icon
                      ></ion-button>

                      <ion-button
                        v-if="showButtonsOptionGuest === indexGuest"
                        fill="clear"
                        color="danger"
                        ><ion-icon :icon="trashOutline"></ion-icon
                      ></ion-button>
                    </ion-item>
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
            class="ion-padding"
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
            reminders = { start: $event.data.start, end: $event.data.end }
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
        <ion-header :translucent="true" class="ion-no-border" mode='ios'>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="modalController.dismiss()"><ion-icon :icon='closeOutline'></ion-icon></ion-button>
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
import { defineComponent, ref } from "vue";
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
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import CalendarComponent from "./calendar/CalendarComponent.vue";

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
    const reminders = ref({
      start: format(new Date(), "Pp"),
      end: format(new Date(), "Pp"),
    });
    const timeZones = Intl.supportedValuesOf("timeZone").map(
      (timeZone) => timeZone
    );
    const isOpenPopoverTimezones = ref(false);
    const filteredZones = ref(Array<string>());
    const zoneSelected = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const guests = ref([
      { email: "pepito@pepito.com" },
      { email: "pepito@pepito.com" },
      { email: "pepito@pepito.com" },
      { email: "pepito@pepito.com" },
    ]);
    const showButtonsOptionGuest = ref(-1);

    return {
      pageTitle: "Agregar evento",
      isOpenPopoverReminders,
      reminders,
      timeZones,
      isOpenPopoverTimezones,
      filteredZones,
      zoneSelected,
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
      modalController,closeOutline
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
      this.zoneSelected = zone;
      this.isOpenPopoverTimezones = false;
    },
  },
});
</script>

<style scoped>
.last-item {
  --border-width: 0 0 1px 0;
  --border-color: red;
}

.hidde-scroll::-webkit-scrollbar {
  display: none;
}
</style>
