"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Notification {
  id: string;
  type: "question" | "event" | "category";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    }
    fetchNotifications();
  }, []);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      // Fetch recent questions (last 10)
      const response = await fetch("/api/questions");
      if (response.ok) {
        const questions = await response.json();
        const recentQuestions = questions.slice(0, 10);
        
        // Convert questions to notifications
        const questionNotifications: Notification[] = recentQuestions.map((q: any) => ({
          id: `question-${q.id}`,
          type: "question" as const,
          title: q.title,
          message: q.isAnonymous ? "An anonymous question was posted" : `${q.user?.name || "Someone"} posted a question`,
          createdAt: q.createdAt,
          read: notifications.find(n => n.id === `question-${q.id}`)?.read || false,
          link: `/chatroom?tab=questions`,
        }));

        // Merge with existing notifications, avoiding duplicates
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newOnes = questionNotifications.filter(n => !existingIds.has(n.id));
          return [...newOnes, ...prev].slice(0, 50); // Keep last 50 notifications
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const addNotification = (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

