import axios, { AxiosInstance } from "axios";
import { UserController } from "../js/userController";
import { TokenController } from "@/js/tokenController";

export class ApiController {
  baseURL = "";

  constructor() {
    const mode = process.env.NODE_ENV;
    if (mode == "development") {
      this.baseURL = "http://localhost:8000/api";
    } else {
      this.baseURL = "https://lifeline-back.dowar.xyz/api";
    }
  }

  private async getClient(): Promise<AxiosInstance> {
    const client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const userController = new UserController();
    const tokenController = new TokenController();

    try {
      const user = await userController.getUserLogged2();
      if (user.id) {
        const token = await tokenController.getUserToken({
          name: "auth_token",
          userId: user.id,
        });
        if (token) {
          client.interceptors.request.use((config) => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
          });
        }
      }
    } catch {
      // No token available
    }

    return client;
  }

  async executeQuery(params: {
    url: string;
    params?: Record<string, any>;
  }): Promise<any> {
    const { url, params: queryParams } = params;
    const client = await this.getClient();
    const response = await client.get(url, { params: queryParams });
    return response.data;
  }

  async executeMutation(params: {
    url: string;
    data?: Record<string, any>;
  }): Promise<any> {
    const { url, data } = params;
    const client = await this.getClient();
    const response = await client.post(url, data);
    return response.data;
  }
}
