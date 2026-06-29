import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface StudyJamSession {
  id: string;
  date: string;
  mode: "host" | "joined";
  userScore: number;
  opponentName: string;
  opponentScore: number;
  userWon: boolean;
  answers: boolean[];
}

interface ProfileState {
  language: string;
  name: string;
  grade: string;
  subjects: string[];
  score: number;
  studyJamHistory: StudyJamSession[];
  lastPromotedAt: string | null;

  setLanguage: (l: string) => void;
  setName: (n: string) => void;
  setGrade: (g: string) => void;
  toggleSubject: (id: string) => void;
  setScore: (s: number) => void;
  addStudyJamSession: (session: StudyJamSession) => void;
  clearStudyJamHistory: () => void;
  setLastPromotedAt: (date: string) => void;
  reset: () => void;
}

const defaults = {
  language: "en",
  name: "",
  grade: "",
  subjects: [] as string[],
  score: 0,
  studyJamHistory: [] as StudyJamSession[],
  lastPromotedAt: null as string | null,
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ...defaults,

      setLanguage: (language) => set({ language }),
      setName: (name) => set({ name }),
      setGrade: (grade) => set({ grade }),
      setScore: (score) => set({ score }),
      addStudyJamSession: (session) =>
        set((state) => ({
          studyJamHistory: [session, ...state.studyJamHistory].slice(0, 20),
        })),
      clearStudyJamHistory: () => set({ studyJamHistory: [] }),
      setLastPromotedAt: (lastPromotedAt) => set({ lastPromotedAt }),

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
