import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dowardev.lifeline",
  appName: "LifeLine",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

if (process.env.NODE_ENV === "development") {
  config.server = {
    ...config.server,
    url: process.env.CAPACITOR_SERVER_URL || "http://localhost:8100",
    cleartext: true,
  };
}

export default config;
