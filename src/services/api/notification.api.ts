import type { Announcement, AnnouncementFormData, Notification } from "@/types";
import { API } from "@/services/http/endpoints";
import { del, delWithBody, get, patch, post } from "@/services/http/request";

export const notificationApi = {
  async getAll(): Promise<Notification[]> {
    const raw = await get<Notification[]>(API.notifications.list);
    return raw;
  },

  async markAsRead(id: string): Promise<Notification> {
    const raw = await patch<Notification>(API.notifications.markRead(id));
    return raw;
  },

  async markAllAsRead(): Promise<Notification[]> {
    const raw = await patch<Notification[]>(API.notifications.markAllRead);
    return raw;
  },

  async getUnreadCount(): Promise<number> {
    const raw = await get<number>(API.notifications.unreadCount);
    return raw;
  },

  async registerDeviceToken(token: string, platform: string = "web"): Promise<{ registered: boolean }> {
    const raw = await post<{ registered: boolean }>(API.notifications.registerDeviceToken, {
      token,
      platform,
    });
    return raw;
  },

  async revokeDeviceToken(token: string): Promise<{ revoked: boolean }> {
    const raw = await delWithBody<{ revoked: boolean }>(API.notifications.revokeDeviceToken, { token });
    return raw;
  },
};

export const announcementApi = {
  async getActive(): Promise<Announcement[]> {
    const raw = await get<Announcement[]>(API.announcements.list, {
      params: { active: "true" },
    });
    return raw;
  },

  async getAll(): Promise<Announcement[]> {
    const raw = await get<Announcement[]>(API.announcements.list);
    return raw;
  },

  async create(data: AnnouncementFormData, createdBy: string): Promise<Announcement> {
    const raw = await post<Announcement>(API.announcements.list, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate,
      createdBy,
    });
    return raw;
  },

  async update(id: string, data: AnnouncementFormData): Promise<Announcement> {
    const raw = await patch<Announcement>(API.announcements.byId(id), data);
    return raw;
  },

  async remove(id: string): Promise<void> {
    await del<unknown>(API.announcements.byId(id));
  },
};