import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { authSlice, loginUser, registerUser } from '../store/slices/authSlice';
import { LoginCredentials, RegisterData } from '../types/user';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      
      // Store credentials for biometric login if successful
      await storageService.setObject('biometric_credentials', {
        username: credentials.username,
        password: credentials.password,
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const result = await dispatch(registerUser(userData)).unwrap();
      
      // Store credentials for biometric login if successful
      await storageService.setObject('biometric_credentials', {
        username: userData.username,
        password: userData.password,
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const socialLogin = async (socialData: {
    provider: 'google' | 'apple';
    token: string;
    userInfo?: any;
  }) => {
    try {
      dispatch(authSlice.actions.loginStart());
      
      // TODO: Implement social login API call
      const response = await authService.socialLogin(socialData);
      
      dispatch(authSlice.actions.loginSuccess(response));
      return response;
    } catch (error) {
      dispatch(authSlice.actions.loginFailure(
        error instanceof Error ? error.message : 'Social login failed'
      ));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Clear biometric credentials
      await storageService.removeItem('biometric_credentials');
      dispatch(authSlice.actions.logout());
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      dispatch(authSlice.actions.logout());
    }
  };

  const clearError = () => {
    dispatch(authSlice.actions.clearError());
  };

  const requestPasswordReset = async (email: string) => {
    try {
      // TODO: Implement password reset API call
      await authService.requestPasswordReset(email);
    } catch (error) {
      throw error;
    }
  };

  return {
    ...auth,
    login,
    register,
    socialLogin,
    logout,
    clearError,
    requestPasswordReset,
  };
};