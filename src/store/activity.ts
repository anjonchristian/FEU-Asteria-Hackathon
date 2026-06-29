import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ActivityState {
  /** Array of ISO date strings (YYYY-MM-DD) when user was active */
  activeDates: string[];

  /** Record today's activity (idempotent — won't add duplicates) */
  recordActivity: () => void;

  /** Get the current streak (consecutive days ending today or yesterday) */
  getStreak: () => number;

  /**
   * Get heatmap data for the last N days.
   * Returns an array of activity levels (0 = none, 1 = active).
   */
  getHeatmapData: (days: number) => number[];

  /** Clear all activity data */
  clearActivity: () => void;
}

/** Returns today's date as YYYY-MM-DD */
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Returns YYYY-MM-DD for a date offset by `daysAgo` from today */
function getDateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activeDates: [],

      recordActivity: () => {
        const today = getTodayKey();
        const { activeDates } = get();
        if (!activeDates.includes(today)) {
          set({ activeDates: [...activeDates, today] });
        }
      },

      getStreak: () => {
        const { activeDates } = get();
        const dateSet = new Set(activeDates);

        let streak = 0;
        // Start from today; if today isn't active, try yesterday as the start
        let startOffset = dateSet.has(getTodayKey()) ? 0 : 1;

        for (let i = startOffset; i < 365; i++) {
          if (dateSet.has(getDateKey(i))) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      getHeatmapData: (days: number) => {
        const { activeDates } = get();
        const dateSet = new Set(activeDates);
        const data: number[] = [];

        // Go from oldest to newest (days-1 ago → today)
        for (let i = days - 1; i >= 0; i--) {
          data.push(dateSet.has(getDateKey(i)) ? 1 : 0);
        }
        return data;
      },

      clearActivity: () => set({ activeDates: [] }),
    }),
    {
      name: "kahayag-activity-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
