import { combineReducers, configureStore } from "@reduxjs/toolkit";
import ticketReducer from "../features/ticket/tickectSlice";
import userReducer from "../features/user/userSlice";
import adminReducer from "../features/admin/adminSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

const rootReducer = combineReducers({
  ticket: ticketReducer,
  user: userReducer,
  admin: adminReducer,
});

const persistConfig = {
  key: "root",
  version: 1,
  storage,   
  whitelist: ['ticket', 'user', 'admin'],
};
// Tạo persistedReducer từ rootReducer và persistConfig
const persistedReducer = persistReducer(persistConfig, rootReducer);
// Tạo store với persistedReducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // bỏ qua warning cho các action liên quan đến persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;