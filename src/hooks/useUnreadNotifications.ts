import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import notificationService from "../services/notificationService";
import type { AppNotification } from "../types";

/** Unread count for the property, refreshed after the user leaves the notifications page. */
export function useUnreadNotifications(propertyId?: number | string) {
  const [unread, setUnread] = useState(0);
  const onNotificationsPage = useLocation({ select: (l) => l.pathname.startsWith("/dashboard/notifications") });

  useEffect(() => {
    if (!propertyId || onNotificationsPage) return;
    let cancelled = false;
    notificationService
      .getPropertyNotifications(propertyId.toString())
      .then((res) => {
        const list: AppNotification[] = Array.isArray(res) ? res : res?.data ?? [];
        if (!cancelled) setUnread(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {
        // The count is a hint; the notifications page surfaces real errors.
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, onNotificationsPage]);

  return onNotificationsPage ? 0 : unread;
}
