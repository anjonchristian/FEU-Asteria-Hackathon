export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fil", label: "Filipino", flag: "🇵🇭" },
] as const;

export const GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
] as const;

export const SUBJECTS = [
  {
    id: "math",
    label: "Math",
    icon: "calculator-outline",
    color: "#28947F",
    bg: "#FEF9DC",
  },
  {
    id: "science",
    label: "Science",
    icon: "flask-outline",
    color: "#1C3829",
    bg: "#DCF0DC",
  },
  {
    id: "reading",
    label: "Reading",
    icon: "book-outline",
    color: "#28947F",
    bg: "#DCF0EB",
  },
  {
    id: "history",
    label: "History",
    icon: "globe-outline",
    color: "#1C3829",
    bg: "#F0F5DC",
  },
  {
    id: "art",
    label: "Art",
    icon: "color-palette-outline",
    color: "#28947F",
    bg: "#FEF9DC",
  },
  {
    id: "music",
    label: "Music",
    icon: "musical-notes-outline",
    color: "#1C3829",
    bg: "#DCF0DC",
  },
  {
    id: "coding",
    label: "Coding",
    icon: "code-slash-outline",
    color: "#28947F",
    bg: "#DCF0EB",
  },
] as const;

export const QUESTIONS = [
  {
    id: 1,
    text: "What is 5 + 8?",
    options: ["11", "12", "13", "14"],
    answer: "13",
  },
  {
    id: 2,
    text: "Which planet is closest to the Sun?",
    options: ["Earth", "Mercury", "Venus", "Mars"],
    answer: "Mercury",
  },
  {
    id: 3,
    text: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    answer: "6",
  },
  {
    id: 4,
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Rome"],
    answer: "Paris",
  },
  {
    id: 5,
    text: "What do plants need to make food?",
    options: ["Moonlight", "Sunlight", "Wind", "Snow"],
    answer: "Sunlight",
  },
  {
    id: 6,
    text: "Which fraction is larger?",
    options: ["1/2", "3/4", "They are equal", "1/3"],
    answer: "3/4",
  },
  {
    id: 7,
    text: 'What is the past tense of "run"?',
    options: ["Runned", "Running", "Ran", "Runs"],
    answer: "Ran",
  },
  {
    id: 8,
    text: "How many continents are on Earth?",
    options: ["5", "6", "7", "8"],
    answer: "7",
  },
  {
    id: 9,
    text: "What is 7 × 6?",
    options: ["36", "42", "48", "56"],
    answer: "42",
  },
  {
    id: 10,
    text: "What gas do humans need to breathe?",
    options: ["Carbon dioxide", "Hydrogen", "Oxygen", "Nitrogen"],
    answer: "Oxygen",
  },
];
