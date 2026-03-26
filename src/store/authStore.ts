import { create } from 'zustand';
import { createStorage } from '../utils/storage';
import type { User } from '../types/user';

const storage = createStorage({ id: 'auth-storage' });

const KEYS = {
  IS_AUTHENTICATED: 'auth_is_authenticated',
  USER: 'auth_user',
  TOKEN: 'auth_token',
} as const;

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  token: string;
  isLoading: boolean;

  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (
    phone: string,
    otp: string,
  ) => Promise<{ success: boolean; isNewUser: boolean }>;
  completeProfile: (data: {
    name: string;
    email: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
  }) => void;
  logout: () => void;
  loadPersistedAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
}

function persistAuth(
  isAuthenticated: boolean,
  user: User | null,
  token: string,
): void {
  storage.set(KEYS.IS_AUTHENTICATED, isAuthenticated);
  storage.set(KEYS.USER, JSON.stringify(user));
  storage.set(KEYS.TOKEN, token);
}

function clearPersistedAuth(): void {
  storage.remove(KEYS.IS_AUTHENTICATED);
  storage.remove(KEYS.USER);
  storage.remove(KEYS.TOKEN);
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: '',
  isLoading: false,

  sendOTP: async (_phone: string): Promise<boolean> => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ isLoading: false });
    return true;
  },

  verifyOTP: async (
    phone: string,
    _otp: string,
  ): Promise<{ success: boolean; isNewUser: boolean }> => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const savedUserJson = storage.getString(KEYS.USER);
    const savedUser = savedUserJson ? JSON.parse(savedUserJson) : null;
    const isNewUser = !savedUser || !savedUser.profileComplete;

    const mockToken = `mock_token_${Date.now()}`;

    const user: User = savedUser ?? {
      id: 'USR001',
      name: '',
      phone,
      email: '',
      dob: '',
      gender: 'Male' as const,
      creditScore: null,
      kycStatus: 'not_started' as const,
      profileComplete: false,
    };

    // Ensure phone is updated to current login phone
    user.phone = phone;

    persistAuth(true, user, mockToken);
    set({
      isAuthenticated: true,
      user,
      token: mockToken,
      isLoading: false,
    });

    return { success: true, isNewUser };
  },

  completeProfile: (data) => {
    const { user, token } = get();
    if (!user) return;

    const updatedUser: User = {
      ...user,
      name: data.name,
      email: data.email,
      dob: data.dob,
      gender: data.gender,
      profileComplete: true,
    };

    persistAuth(true, updatedUser, token);
    set({ user: updatedUser });
  },

  logout: () => {
    clearPersistedAuth();
    set({
      isAuthenticated: false,
      user: null,
      token: '',
      isLoading: false,
    });
  },

  loadPersistedAuth: async () => {
    await storage.waitUntilReady();

    const isAuthenticated = storage.getBoolean(KEYS.IS_AUTHENTICATED);
    const userJson = storage.getString(KEYS.USER);
    const token = storage.getString(KEYS.TOKEN);

    if (isAuthenticated && userJson && token) {
      try {
        const user: User = JSON.parse(userJson);
        set({ isAuthenticated: true, user, token });
      } catch {
        clearPersistedAuth();
      }
    }
  },

  updateProfile: (data: Partial<User>) => {
    const { user, token } = get();
    if (!user) return;

    const updatedUser: User = { ...user, ...data };
    persistAuth(true, updatedUser, token);
    set({ user: updatedUser });
  },
}));
