import { storage } from "@/main";
import { useSystemStore } from "@/store/system";
import axios from "axios";

export class WakaTimeController {
  async loadWakaTimeApiKey(): Promise<void> {
    const apiKey = await this.getWakaTimeApiKeyLocal();
    const systemStore = useSystemStore();
    systemStore.setWakaTimeApiKey({ apiKey });
  }

  /**
   * This asynchronous method retrieves the WakaTime API key from local storage.
   *
   * @returns A Promise that resolves to a string, which is the WakaTime API key.
   */
  private async getWakaTimeApiKeyLocal(): Promise<string> {
    return await storage.get("wakaTimeApiKey");
  }

  /**
   * This asynchronous method retrieves the WakaTime durations for a specific date.
   *
   * @param params - An object containing the API key and the date.
   * @param params.apiKey - The WakaTime API key.
   * @param params.date - The date for which the durations are to be retrieved. It should be in the format 'YYYY-MM-DD'.
   *
   * @returns A Promise that resolves to a WakaTimeDuration object, which contains the coding durations for the specified date.
   *
   * @throws Will throw an error if the request fails.
   */
  async getWakaTimeDurations(params: {
    apiKey: string;
    date: string;
  }): Promise<WakaTimeDuration> {
    const { apiKey, date } = params;

    const response = await axios.request({
      url: "http://127.0.0.1:8000/api/wakatime-durations",
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        apiKey: apiKey,
        date,
      },
    });

    try {
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * This method retrieves the WakaTime API key from the system store.
   *
   * @returns A string, which is the WakaTime API key.
   */
  getWakaTimeApiKey(): string {
    const systemStore = useSystemStore();
    return systemStore.getWakaTimeApiKey;
  }

  /**
   * This asynchronous method tests the validity of a WakaTime API key.
   *
   * @param params - An object containing the API key and a date.
   * @param params.apiKey - The WakaTime API key to be tested.
   * @param params.date - A date for which the durations are to be retrieved. It should be in the format 'YYYY-MM-DD'.
   *
   * @returns A Promise that resolves to a boolean. The boolean is true if the API key is valid, and false otherwise.
   *
   * @throws Will throw an error if the request fails.
   */
  async testWakaTimeApiKey(params: {
    apiKey: string;
    date: string;
  }): Promise<boolean> {
    const { apiKey, date } = params;
    try {
      const response = await this.getWakaTimeDurations({ apiKey, date });
      if (response) return true;
      else return false;
    } catch (error) {
      throw error;
    }
  }

  async loadWakaTimeToday(params: { apiKey: string }) {
    // const { apiKey } = params;
    // const response = await getWakaTimeDurations({ apiKey });
    // console.log(response);
  }

  /**
   * This asynchronous method retrieves the total coding time for a specific date from WakaTime.
   *
   * @param params - An object containing the API key and the date.
   * @param params.apiKey - The WakaTime API key.
   * @param params.date - The date for which the total coding time is to be retrieved. It should be in the format 'YYYY-MM-DD'.
   *
   * @returns A Promise that resolves to a number, which is the total coding time in seconds for the specified date.
   *
   * @throws Will throw an error if the request fails.
   */
  async getWakaTimeDayTotal(params: {
    apiKey: string;
    date: string;
  }): Promise<number> {
    const { apiKey, date } = params;
    const response = await this.getWakaTimeDurations({
      apiKey,
      date,
    });
    let sum = 0;
    response.data.forEach((element) => {
      sum += element.duration;
    });
    return sum;
  }

  /**
   * This asynchronous method stores the WakaTime API key in local storage.
   *
   * @param params - An object containing the API key.
   * @param params.apiKey - The WakaTime API key to be stored.
   *
   * @returns A Promise that resolves when the API key has been successfully stored.
   */
  async storeWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
    const { apiKey } = params;
    await storage.set("wakaTimeApiKey", apiKey);
  }

  /**
   * This asynchronous method clears the WakaTime API key from both local storage and the system store.
   *
   * @returns A Promise that resolves when the API key has been successfully cleared.
   */
  async clearWakaTimeApiKey(): Promise<void> {
    await this.deleteWakaTimeApiKey();
    const systemStore = useSystemStore();
    systemStore.removeWakaTimeApiKey();
  }

  private async deleteWakaTimeApiKey(): Promise<void> {
    await storage.remove("wakaTimeApiKey");
  }
}
