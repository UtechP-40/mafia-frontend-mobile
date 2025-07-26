import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  notifications: Array<{
    id?: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    persistent?: boolean;
  }>;
}

const initialState: UIState = {
  notifications: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      duration?: number;
      persistent?: boolean;
    }>) => {
      state.notifications.push({
        id: `notification_${Date.now()}`,
        ...action.payload,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;