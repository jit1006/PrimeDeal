import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  LoginInputState,
  SignupInputState,
  ProfileInputState,
} from "@/schema/userSchema";
import { toast } from "sonner";
import { useShopStore } from "./useShopStore";
import API from "@/config/api";
import { useCartStore } from "./useCartStore";


type User = {
  fullname: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
  admin: boolean;
  isverified: boolean;
};
// type Address = {
//   addressLine1: string;
//   addressLine2: string;
//   city: string;
//   state: string;
//   postalCode: string;
//   country: string;
//   latitude?: number;
//   longitude?: number;
//   isDefault?: boolean;
// };
type UserState = {
  user: User | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  loading: boolean;

  signup: (input: SignupInputState) => Promise<boolean>;
  login: (input: LoginInputState) => Promise<void>;
  checkAuthentication: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileInputState) => Promise<void>;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
      loading: false,

      //signUp api implementation
      signup: async (input: SignupInputState) => {
        set({ loading: true });
        try {
          const response = await API.post(`/user/signup`, input, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (response.data.success) {
            toast.success(response.data.message);
            set({
              loading: false,
              user: response.data.user,
            });
          }

          set({ loading: false });

          return response.data.success;
        } catch (error: any) {
          console.error("Signup error:", error);
          toast.error(error.response.data.message);
          set({ loading: false });
          return false;
        }
      },

      //login api implementation
      login: async (input: LoginInputState) => {
        try {
          set({ loading: true });
          const response = await API.post(`/user/login`, input);
          if (response.data.success) {
            toast.success(response.data.message);
            set({
              loading: false,
              user: response.data.user,
              isAuthenticated: true,
            });
          } else {
            toast.error(response.data.message);
            set({ loading: false });
          }
        } catch (error: any) {
          console.error("Signup error:", error);
          toast.error(error.response.data.message);
          set({ loading: false });
        }
      },

      //checkAuthentication api implementation
      checkAuthentication: async () => {
        try {
          set({ isCheckingAuth: true });
          const response = await API.get(`/user/checkauth`);
          if (response.data.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isCheckingAuth: false,
            });
          }
        } catch (error) {
          set({ isAuthenticated: false, isCheckingAuth: false });
        }
      },

      //logout api implementation
      logout: async () => {
        try {
          set({ loading: true });
          const response = await API.post(`/user/logout`);
          if (response.data.success) {
            toast.success(response.data.message);
            useCartStore.getState().clearCart();
            useShopStore.getState().clearShop();
          } else {
            toast.error(response.data.message);
          }
          set({ loading: false, user: null, isAuthenticated: false });
        } catch (error) {
          set({ loading: false });
        }
      },
      //update user profile api implementation
      updateProfile: async (input: ProfileInputState) => {
        try {
          const payload = {
            ...input,
            contact: input.phoneNumber,
          };
          const response = await API.put(`/user/profile/update`, payload, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (response.data.success) {
            toast.success(response.data.message);
            set({ user: response.data.user, isAuthenticated: true });
          }
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to update profile");
        }
      },
    }),
    {
      name: "user-name",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
