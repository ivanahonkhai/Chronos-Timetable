export interface Activity {
  id: number;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  dayOfWeek: number; // 0-6 (Sun-Sat)
  category?: string;
  color?: string;
  completed: number; // 0 or 1
}

export interface Template {
  id: number;
  title: string;
  category?: string;
  color?: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
