import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import messageNotificationReducer from "./slices/messageNotificationSlice";
import notificationReducer from "./slices/notificationSlice";
import conversationReducer from "./slices/conversationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messageNotification: messageNotificationReducer,
    notifications: notificationReducer,
    conversations: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

