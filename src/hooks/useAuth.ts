import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { authSlice } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const login = (credentials: { username: string; password: string }) => {
    dispatch(authSlice.actions.loginStart());
    // Login logic will be implemented later
  };

  const logout = () => {
    dispatch(authSlice.actions.logout());
  };

  const clearError = () => {
    dispatch(authSlice.actions.clearError());
  };

  return {
    ...auth,
    login,
    logout,
    clearError,
  };
};