"use client";

import React, { useCallback, useRef } from "react";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

type NotificationContextValue = {
  show: (payload: Notification) => void;
  remove: (id: string) => void;
};

// 1) Define context FIRST
export const NotificationContext =
  React.createContext<NotificationContextValue | null>(null);

// 2) Explicitly type the hook return
export const useNotify = (): NotificationContextValue => {
  const ctx = React.useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotify must be used within NotificationProvider");
  }
  return ctx;
};

const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback((payload: Notification) => {
    setNotifications((prev) => [...prev, payload]);

    if (payload.duration && payload.duration > 0) {
      const timer = setTimeout(() => {
        remove(payload.id);
      }, payload.duration);
      timersRef.current.set(payload.id, timer);
    }
  }, [remove]);

  return (
    <NotificationContext.Provider value={{ show, remove }}>
      {/* 3) Render app */}
      {children}

      {/* 4) Render notifications */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg text-white px-4 py-3 shadow-lg border ${
              n.type === "error"
                ? "bg-red-900/90 border-red-500/50"
                : n.type === "success"
                ? "bg-green-900/90 border-green-500/50"
                : "bg-blue-900/90 border-blue-500/50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">{n.message}</p>
              <button
                onClick={() => remove(n.id)}
                className="text-white/70 hover:text-white shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
