import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dowardev.lifeline",
  appName: "LifeLine",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    url: "http://192.168.1.74:8100",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
