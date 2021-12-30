<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<ion-toolbar class="color-menu">
				<ion-item lines="none" v-if="logged == true">
					<ion-avatar slot="start">
						<img :src="userData.img" />
					</ion-avatar>
					<ion-label class="text-menu-color">{{userData.user}}</ion-label>
					<ion-button slot="end" fill="clear">
						<ion-icon :icon="settingsOutline"></ion-icon>
					</ion-button>
				</ion-item>
				<ion-item v-if="logged == false">
					<ion-button fill="clear" @click="openRoute('/sesion')">Iniciar sesion</ion-button>
					<ion-button fill="clear" @click="openRoute('/registro')">Registrarse</ion-button>
				</ion-item>
			</ion-toolbar>
		</ion-header>

		<ion-content class="color-menu">
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="homeOutline"></ion-icon>
				<ion-label class="text-menu-color">Inicio</ion-label>
			</ion-item>
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="cloudDownloadOutline"></ion-icon>
				<ion-label class="text-menu-color">Modulos</ion-label>
			</ion-item>
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="documentOutline"></ion-icon>
				<ion-label class="text-menu-color">Notas</ion-label>
			</ion-item>
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="checkboxOutline"></ion-icon>
				<ion-label class="text-menu-color">Tareas</ion-label>
			</ion-item>
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="cogOutline"></ion-icon>
				<ion-label class="text-menu-color">Programacion</ion-label>
			</ion-item>
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="briefcaseOutline"></ion-icon>
				<ion-label class="text-menu-color">Proyectos</ion-label>
			</ion-item>
			<ion-item lines="none" button v-on:click="openRoute('/')" class="color-menu">
				<ion-icon class="icon-menu-color" slot="start" :icon="helpOutline"></ion-icon>
				<ion-label class="text-menu-color">Soporte</ion-label>
			</ion-item>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
import {
	IonContent,
	IonHeader,
	IonPage,
	IonToolbar,
	menuController,
} from "@ionic/vue";
import {defineComponent} from "vue";
import {
	settingsOutline,
	homeOutline,
	documentOutline,
	checkboxOutline,
	briefcaseOutline,
	helpOutline,
	cogOutline,
	cloudDownloadOutline,
} from "ionicons/icons/";
import userService from "../../services/user.vue";
import eventBus from "../../EventBus";

export default defineComponent({
	name: "Menu",
	components: {
		IonContent,
		IonHeader,
		IonPage,
		IonToolbar,
	},
	setup() {
		return {
			settingsOutline,
			homeOutline,
			documentOutline,
			checkboxOutline,
			briefcaseOutline,
			helpOutline,
			menuController,
			cogOutline,
			cloudDownloadOutline,
		};
	},
	data() {
		return {
			logged: false,
			userData: {
				img: require("../../../public/assets/otros/user.svg"),
				user: "Usuario",
			},
		};
	},
	mounted() {
		this.getUser();
		eventBus().emitter.on("content-refresh", () => {
			this.getUser();
			eventBus().emitter.all.clear();
		});
	},
	methods: {
		openRoute(route: string) {
			this.menuController.close();
			this.$router.push(route);
		},
		getUser() {
			userService()
				.getUserLogged()
				.then((response) => {
					this.logged = true;
					this.userData.user = response.data.user;
				});
		},
	},
});
</script>

<style scoped>
.color-menu {
	--background: #252729;
}
.text-menu-color {
	color: white;
}
.icon-menu-color {
	color: white;
}
</style>
