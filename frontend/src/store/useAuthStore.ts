import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { io, Socket } from "socket.io-client";

const BASE_URL = "http://localhost:5001";

interface AuthUser {
  _id: string;
  email: string;
  fullName: string;
  profilePic?: string;
  createdAt?: string;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  profilePic?: string;
  fullName?: string;
}

interface AuthStore {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: Socket | null;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data: SignupData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      set({ isSigningUp: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully!");
      get().disconnectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed. Please try again.");
    }
  },
  login: async (data: LoginData) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully!");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      set({ isLoggingIn: false });
    }
  },
  updateProfile: async (data: UpdateProfileData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.log("Error in updateProfile:", { error });
      toast.error(error.response?.data?.message || "Profile update failed. Please try again.");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
    });
    socket.connect();
    set({ socket: socket });
    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
  },
}));
