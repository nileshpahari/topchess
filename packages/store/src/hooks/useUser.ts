import { useAppSelector } from '../hooks';

export const useUser = () => {
  return useAppSelector((state) => state.user.user);
};

export const useAuthStatus = () => {
  return useAppSelector((state) => state.user.status);
};
