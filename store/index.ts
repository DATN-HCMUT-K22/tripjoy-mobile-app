import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import messageNotificationReducer from "./slices/messageNotificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messageNotification: messageNotificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

