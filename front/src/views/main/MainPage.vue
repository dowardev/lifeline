<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="md">
      <div>
        <!-- session -->
        <SessionHeaderComponent
          v-if="
            $route.path == '/session' ||
            $route.path == '/signup' ||
            $route.path == '/login'
          "
          :page-title="sessionComponent.pageTitle"
          :main-segment="sessionComponent.mainSegment"
          @main-segment="sessionComponent.mainSegment = $event"
        />

        <!-- landing -->
        <LandingHeaderComponent
          v-if="$route.path == '/landing'"
          :page-title="landingComponent.pageTitle"
        />

        <!-- home -->
        <HomeHeaderComponent
          v-if="$route.path == '/home'"
          :page-title="homeComponent.pageTitle"
        />

        <!-- calendar -->
        <CalendarHeaderComponent
          v-if="$route.path == '/calendar' && calendarComponent.ready"
          @add="calendarComponentRef.openModalAdd({ event: $event })"
          @reschedule="calendarComponentRef.reschedule()"
          @sync="calendarComponentRef.syncAction()"
        />

        <!-- integrations -->
        <IntegrationsHeaderComponen
          v-if="$route.path == '/integrations'"
          :page-title="integrationsComponent.pageTitle"
          @main-option="integrationsComponent.mainOption = $event"
        />

        <!-- taks -->
        <TasksHeaderComponent
          v-if="$route.path == '/tasks'"
          :page-title="tasksComponent.pageTitle"
        />

        <!-- policies -->
        <PoliciesHeaderComponent
          v-if="$route.path == '/policies'"
          :page-title="policiesComponent.pageTitle"
        />
      </div>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-card
        style="height: var(--card-main-height); margin-bottom: 16px"
        class="ion-padding"
      >
        <!-- session -->
        <SessionContentComponent
          v-if="
            $route.path == '/session' ||
            $route.path == '/signup' ||
            $route.path == '/login'
          "
          :main-segment="sessionComponent.mainSegment"
          :page-title="sessionComponent.pageTitle"
        />

        <!-- landing -->
        <LandingContentComponent
          v-if="$route.path == '/landing'"
          :page-title="landingComponent.pageTitle"
        />

        <!-- home -->
        <HomeContentComponent
          v-if="$route.path == '/home'"
          :page-title="homeComponent.pageTitle"
        />

        <!-- calendar-->
        <CalendarContentComponent
          v-if="$route.path == '/calendar' && calendarComponent.ready"
          ref="calendarComponentRef"
        />

        <!-- integrations -->
        <IntegrationsContentComponent
          v-if="$route.path == '/integrations'"
          :page-title="integrationsComponent.pageTitle"
          :main-option="integrationsComponent.mainOption"
        />

        <!-- tasks -->
        <TasksContentComponent
          v-if="$route.path == '/tasks'"
          :page-title="tasksComponent.pageTitle"
        />

        <!-- policies -->
        <PoliciesContentComponent
          v-if="$route.path == '/policies'"
          :page-title="policiesComponent.pageTitle"
          @main-option="policiesComponent.mainOption = $event"
        />
        <div style="margin-bottom: 16px"></div>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage } from "@ionic/vue";
import { reactive } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { CalendarController } from "@/controllers/calendarController";
const systemController = new SystemController();
const eventController = new EventController();
const calendarController = new CalendarController();

// components
import SessionHeaderComponent from "@/views/sesion/header/SessionHeaderComponent.vue";
import SessionContentComponent from "@/views/sesion/SessionContentComponent.vue";
import LandingContentComponent from "@/views/lading/content/LandingCotentComponent.vue";
import LandingHeaderComponent from "@/views/lading/header/LandingHeaderComponent.vue";
import HomeContentComponent from "@/views/home/content/HomeContentComponent.vue";
import HomeHeaderComponent from "@/views/home/header/HomeHeaderComponent.vue";
import CalendarContentComponent from "@/views/calendar/content/CalendarContentComponent.vue";
import CalendarHeaderComponent from "@/views/calendar/header/CalendarHeaderComponent.vue";
import IntegrationsHeaderComponen from "@/views/integrations/header/IntegrationsHeaderComponent.vue";
import IntegrationsContentComponent from "@/views/integrations/content/IntegrationsContentComponent.vue";
import TasksHeaderComponent from "@/views/tasks/header/TasksHeaderComponent.vue";
import TasksContentComponent from "@/views/tasks/content/TasksContentComponent.vue";
import PoliciesHeaderComponent from "@/views/policies/header/PoliciesHeaderComponent.vue";
import PoliciesContentComponent from "@/views/policies/content/PoliciesContentComponent.vue";
import { onMounted } from "vue";
import { ViewCalendar } from "@/utils/types";

// vars
const route = useRoute();

// refs
const calendarComponentRef = ref();

// reactive
const sessionComponent = reactive({
  mainSegment: route.path == "/login" ? "login" : "signup",
  pageTitle: route.path == "/login" ? "Iniciar sesión" : "Registrarse",
});
const landingComponent = reactive({
  pageTitle: route.path == "",
});
const homeComponent = reactive({
  pageTitle: route.path == "Inicio",
});
const calendarComponent = reactive({
  ready: false,
});
const integrationsComponent = reactive({
  pageTitle: route.path == "Integraciones",
  mainOption: "installed",
});
const tasksComponent = reactive({
  pageTitle: route.path == "Tareas",
});
const policiesComponent = reactive({
  pageTitle: route.path == "Politicas",
  mainOption: "privacy",
});

onMounted(async () => {
  await loadPropsCalendarComponent();
  calendarComponent.ready = true;
});

// functions
async function loadPropsCalendarComponent(): Promise<void> {
  // load calendar view mode
  const mode = await calendarController.getStoredCalendarModeView();
  const currentDates = await eventController.getCurrentDatesStored();

  calendarController.setCurrentDates({
    dates: currentDates,
  });
  calendarController.setCalendarModeView({ mode });
}
</script>
