import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import messageNotificationReducer from "./slices/messageNotificationSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messageNotification: messageNotificationReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

