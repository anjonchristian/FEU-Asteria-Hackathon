import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProfileState {
  language: string;
  name: string;
  grade: string;
  subjects: string[];
  score: number;

  setLanguage: (l: string) => void;
  setName: (n: string) => void;
  setGrade: (g: string) => void;
  toggleSubject: (id: string) => void;
  setScore: (s: number) => void;
  reset: () => void;
}

const defaults = {
  language: "en",
  name: "",
  grade: "",
  subjects: [] as string[],
  score: 0,
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ...defaults,

      setLanguage: (language) => set({ language }),
      setName: (name) => set({ name }),
      setGrade: (grade) => set({ grade }),
      setScore: (score) => set({ score }),

      toggleSubject: (id) =>
        set((s) => ({
          subjects: s.subjects.includes(id)
            ? s.subjects.filter((x) => x !== id)
            : [...s.subjects, id],
        })),

      reset: () => set(defaults),
    }),
    {
      name: "kahayag-profile-storage", // Unique storage key name
      storage: createJSONStorage(() => AsyncStorage), // Point Zustand to React Native's storage engine
    },
  ),
);
