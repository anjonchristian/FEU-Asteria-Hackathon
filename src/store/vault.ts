import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Flashcard {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface Deck {
  id: string;
  title: string;
  subjectId: string;
  createdAt: string;
  cards: Flashcard[];
  lastScore?: number;
}

interface VaultState {
  decks: Deck[];
  addDeck: (deck: Deck) => void;
  deleteDeck: (id: string) => void;
  updateDeckScore: (id: string, score: number) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      decks: [],
      addDeck: (deck) =>
        set((state) => ({
          decks: [deck, ...state.decks],
        })),
      deleteDeck: (id) =>
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
        })),
      updateDeckScore: (id, score) =>
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === id ? { ...d, lastScore: score } : d,
          ),
        })),
      clearVault: () => set({ decks: [] }),
    }),
    {
      name: "kahayag-vault-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
