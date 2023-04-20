import { useDocument } from "@/composables/useDocument";
import { userReminderStore } from "@/store/notificationsStore";
import { Reminder } from "@/utils/interfaces";
import { LocalNotifications } from "@capacitor/local-notifications";
import { format } from "date-fns";

export const useReminders = () => {
  const reminderStore = userReminderStore();

  function loadReminders() {
    const documents = useDocument().getUserDocuments() ?? [];

    documents.forEach(async (document) => {
      document.elements?.forEach(async (element) => {
        if (!element.data || !element.data.reminder) return;

        const date = {
          start: format(
            new Date(element.data.reminder.reminderStart),
            "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
          ),
          end: format(
            new Date(element.data.reminder.reminderStart),
            "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
          ),
        };

        const id = new Date().getTime();
        const reminder = { title: "", message: "", id, date } as Reminder;

        reminderStore.addNotification({ reminder });
      });
    });
  }
  // function loadReminders() {
  //   const documents = useDocument().getUserDocuments() ?? [];
  //
  //   documents.forEach(async (document) => {
  //     document.elements?.forEach(async (element) => {
  //       if (!element.data.reminder) return;
  //
  //       const reminder = format(
  //         new Date(element.data.reminder.reminderStart),
  //         "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
  //       );
  //       if (!reminder) return;
  //       const id = new Date().getTime();
  //
  //       await setReminders({ reminder, id });
  //
  //       element.data.reminder!.notificationId = id.toString();
  //     });
  //
  //     await useDocument().updateDocument({ document });
  //   });
  // }

  async function setReminders(params: { reminder: string; id: number }) {
    const reminder = params.reminder;
    const id = params.id;
    const permission = await checkNotificationsPermissions();
    if (permission == false) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "My notification",
          body: "This is my notification",
          id,
          schedule: {
            at: new Date(reminder),
          },
          sound: null,
          attachments: null,
          actionTypeId: "",
          extra: null,
          channelId: null,
        },
      ],
    });
  }

  async function checkNotificationsPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display == "granted") {
      return true;
    } else {
      return false;
    }
  }

  function getReminders(): Array<Reminder> | undefined {
    const reminders = reminderStore.getReminders();
    return reminders != null
      ? JSON.parse(JSON.stringify(reminders))
      : undefined;
  }

  return {
    loadReminders,
    setReminders,
    checkNotificationsPermissions,
    getReminders
  };
};
