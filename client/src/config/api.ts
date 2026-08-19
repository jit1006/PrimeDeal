import axios, { AxiosError } from "axios";
import { API_END_POINT } from "./varibles";
import { toast } from "sonner";

// Create an Axios instance
const API = axios.create({
  baseURL: API_END_POINT, // change this to your base URL
  timeout: 10000, // timeout in milliseconds (e.g., 10000 = 10 seconds)
  withCredentials: true,
});

// ✅ Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    toast.error("Request setup failed!");
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor
API.interceptors.response.use(
  (response) => {
    const  { data} = response;
    console.log(data)
    return response;  },
  async (error: AxiosError) => {
    if (!error.response) {
      toast.error("Network error — please check your internet connection.");
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    console.log(status,data);
    switch (status) {
      case 400:
        toast.error((data as any)?.message || "Bad Request — check your input.");
        break;

      case 401:
        toast.error("Session expired. Please log in again.");
        localStorage.clear();
        break;

      case 403:
        toast.error("You are not authorized to perform this action.");
        break;

      case 408:
        toast.error("Request timeout. Please try again.");
        break;

      case 500:
        toast.error("Internal server error. Please try later.");
        break;

      case 503:
        toast.error("Server unavailable. Please try again soon.");
        break;

      default:
        toast.error((data as any)?.message || "An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

export default API;
