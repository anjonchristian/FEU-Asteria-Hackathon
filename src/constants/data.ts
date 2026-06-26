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
    id: "filipino",
    label: "Filipino",
    icon: "library-outline",
    color: "#28947F",
    bg: "#DCF0EB",
  },
  {
    id: "english",
    label: "English",
    icon: "text-outline",
    color: "#1C3829",
    bg: "#FEF9DC",
  },
  {
    id: "math",
    label: "Mathematics",
    icon: "calculator-outline",
    color: "#28947F",
    bg: "#DCF0DC",
  },
  {
    id: "science",
    label: "Science",
    icon: "flask-outline",
    color: "#1C3829",
    bg: "#F0F5DC",
  },
  {
    id: "ap",
    label: "Araling Panlipunan",
    icon: "globe-outline",
    color: "#28947F",
    bg: "#FEF9DC",
  },
  {
    id: "mapeh",
    label: "MAPEH",
    icon: "color-palette-outline",
    color: "#1C3829",
    bg: "#DCF0EB",
  },
  {
    id: "tle",
    label: "EPP / TLE",
    icon: "construct-outline",
    color: "#28947F",
    bg: "#DCF0DC",
  },
  {
    id: "gmrc",
    label: "GMRC",
    icon: "heart-outline",
    color: "#1C3829",
    bg: "#F0F5DC",
  },
] as const;

export const QUESTIONS = [
  {
    id: 1,
    text: "Alin sa mga sumusunod na salita ang halimbawa ng pandiwa (verb)?",
    options: ["Maganda", "Tumakbo", "Mabilis", "Kahon"],
    answer: "Tumakbo",
  },
  {
    id: 2,
    text: "Which of the following sentences has the correct subject-verb agreement?",
    options: [
      "The dogs barks loudly.",
      "The dog bark loudly.",
      "The dogs bark loudly.",
      "The dog barking loudly.",
    ],
    answer: "The dogs bark loudly.",
  },
  {
    id: 3,
    text: "What is the lowest term of the fraction 8/24?",
    options: ["1/4", "1/2", "1/3", "2/6"],
    answer: "1/3",
  },
  {
    id: 4,
    text: "What part of the plant is primarily responsible for making food through photosynthesis?",
    options: ["Roots", "Stem", "Leaves", "Flowers"],
    answer: "Leaves",
  },
  {
    id: 5,
    text: "Sino ang itinuturing na pambansang bayani ng Pilipinas na sumulat ng Noli Me Tangere?",
    options: [
      "Andres Bonifacio",
      "Apolinario Mabini",
      "Emilio Aguinaldo",
      "Jose Rizal",
    ],
    answer: "Jose Rizal",
  },
  {
    id: 6,
    text: "In Music, what does the dynamic symbol 'p' (piano) mean?",
    options: ["Play fast", "Play softly", "Play loudly", "Play slowly"],
    answer: "Play softly",
  },
  {
    id: 7,
    text: "In ICT, what is the standard keyboard shortcut to 'Copy' a selected text or file?",
    options: ["Ctrl + V", "Ctrl + X", "Ctrl + C", "Ctrl + P"],
    answer: "Ctrl + C",
  },
  {
    id: 8,
    text: "Ano ang tamang gawin kung nakita mong nahulog ang pitaka ng isang matanda sa kalsada?",
    options: [
      "Iwanan lang ito.",
      "Pulutin at itago ang pera.",
      "Pulutin at ibalik sa matanda.",
      "Ibigay sa ibang taong dumadaan.",
    ],
    answer: "Pulutin at ibalik sa matanda.",
  },
  {
    id: 9,
    text: "Which force pulls objects towards the center of the Earth?",
    options: ["Friction", "Magnetism", "Gravity", "Electricity"],
    answer: "Gravity",
  },
  {
    id: 10,
    text: "What is the area of a rectangle with a length of 5cm and a width of 4cm?",
    options: ["9 sq cm", "18 sq cm", "20 sq cm", "25 sq cm"],
    answer: "20 sq cm",
  },
];
