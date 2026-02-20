import { Activity, Template } from "../types";

export const api = {
  async getActivities(): Promise<Activity[]> {
    const res = await fetch("/api/activities");
    return res.json();
  },

  async addActivity(activity: Omit<Activity, "id" | "completed">): Promise<{ id: number }> {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    });
    return res.json();
  },

  async toggleActivity(id: number): Promise<void> {
    await fetch(`/api/activities/${id}/toggle`, {
      method: "PATCH",
    });
  },

  async deleteActivity(id: number): Promise<void> {
    await fetch(`/api/activities/${id}`, {
      method: "DELETE",
    });
  },

  // Templates
  async getTemplates(): Promise<Template[]> {
    const res = await fetch("/api/templates");
    return res.json();
  },

  async addTemplate(template: Omit<Template, "id">): Promise<{ id: number }> {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    return res.json();
  },

  async deleteTemplate(id: number): Promise<void> {
    await fetch(`/api/templates/${id}`, {
      method: "DELETE",
    });
  },
};
