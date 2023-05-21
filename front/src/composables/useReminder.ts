export const useReminder = () => {
  function getEventReminders(params: {
    notifications: string[];
    dateStart: string;
  }) {
    const { notifications, dateStart } = params;

    const notificationTimes: { [key: string]: number } = {
      just: 0,
      "5mb": -5,
      "10mb": -10,
      "15mb": -15,
      "30mb": -30,
      "1hb": -60,
      "2hb": -120,
      "1db": -1440,
      "2db": -2880,
      "1wb": -10080,
      "1mb": -43200,
    };

    if (!dateStart || !notifications) {
      return [];
    }

    const startDate = new Date(dateStart);
    const notificationDates: Date[] = [];

    for (const notification of notifications) {
      const timeOffset = notificationTimes[notification];
      if (timeOffset !== undefined) {
        const notificationDate = new Date(
          startDate.getTime() + timeOffset * 60000
        );
        notificationDates.push(notificationDate);
      }
    }
    return notificationDates;
  }
  return { getEventReminders };
};
