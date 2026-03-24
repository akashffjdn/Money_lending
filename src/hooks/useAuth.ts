import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return { isAuthenticated, user, logout };
};
