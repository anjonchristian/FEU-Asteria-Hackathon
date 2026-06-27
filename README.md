<p align="center">
  <img src="assets/images/github-icon.png" width="120" alt="Kahayag Logo"/>
</p>
<h1 align="center">Kahayag</h1>
<p align="center">
  <b>Lightweight, zero-connectivity mobile learning platform for Filipino students.</b><br/>
  Supports Android and iOS.
</p>

---

## 🎯 Project Overview

### AI-Powered Study Companion for Filipino Learners

**Project Kahayag** (meaning _light_ or _brightness_) is an offline-first AI learning companion designed for Filipino primary students.

It tackles the digital divide by bringing personalized education support directly to mobile devices — with:

- Zero internet dependency
- Zero cloud costs
- Zero required data connection

By running a localized **Small Language Model (SLM)** through `llama.rn` and combining it with offline OCR, Kahayag transforms a smartphone into an intelligent study guide available anytime, anywhere.

---

# ✨ Features

## 🧠 Local AI Tutor

Powered by `llama.rn`, Kahayag runs a 4-bit quantized Small Language Model directly on the device.

Features:

- AI-powered explanations
- Question answering
- Study hints
- Practice generation
- Offline tutoring

---

## 📸 Offline Textbook Scanner

Students can scan physical learning materials using built-in OCR.

Features:

- Extracts text from images
- Processes completely offline
- Supports textbooks, modules, and worksheets
- No cloud OCR APIs required

---

## 🇵🇭 Filipino + English Support

Kahayag supports:

- English
- Filipino
- Conversational Taglish

Helping students learn using familiar language.

---

## 🎮 Study Jam Sessions

Using Bluetooth Low Energy (BLE), students can:

- Join peer learning sessions
- Challenge classmates
- Compete in educational quizzes
- Review together without internet access

---

## 📈 Adaptive Learning System

Kahayag tracks progress locally.

The system:

- Records answers
- Measures topic mastery
- Adjusts difficulty
- Builds personalized learning paths

---

# 🚀 Installation

## Prerequisites

| Software       | Version                          |
| -------------- | -------------------------------- |
| Node.js        | 18+ (Developed using Node.js 22) |
| npm            | Latest                           |
| Git            | Latest                           |
| Expo Go        | Latest (Optional)                |
| Android Studio | Recommended                      |
| Xcode          | Required for iOS                 |

---

# Clone Repository

```bash
git clone <repository-url>
cd kahayag
npm install
```

---

# Running the Application

## Option 1 — Expo Go

Start the development server:

```bash
npm start
```

Steps:

1. Open Expo Go
2. Scan the QR code
3. Wait for the application to load

### Offline Testing

After the app loads:

```text
Enable Airplane Mode to test offline functionality.
```

---

## Option 2 — Development Build

Required for native features such as:

- llama.rn
- OCR
- Bluetooth Low Energy

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

---

# Available Scripts

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `npm start`             | Start Expo server           |
| `npm run android`       | Run Android build           |
| `npm run ios`           | Run iOS build               |
| `npm run lint`          | Run linter                  |
| `npm run reset-project` | Reset project configuration |

---

# Troubleshooting

Clear Expo cache:

```bash
npx expo start --clear
```

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

# 🛠 Tech Stack

## AI

- `llama.rn`
- Local Small Language Model
- 4-bit quantization

## Mobile

- React Native
- Expo
- Expo Router

## OCR

- `react-native-ml-kit/text-recognition`

## Database

- SQLite

## UI

- NativeWind / TailwindCSS
- Lucide Icons

## State Management

- Zustand

## Connectivity

- Bluetooth Low Energy (BLE)

---

# 🗄 Database Architecture

Kahayag uses SQLite for fully offline storage.

## Student Records

```sql
students
```

Stores:

- Student profile
- Grade level
- XP
- Learning streaks

---

## Academic Structure

```sql
subjects
topics
student_topic_mastery
```

Handles:

- Subjects
- Topics
- Mastery tracking
- Learning progress

---

## AI Learning History

```sql
session_history
```

Stores:

- Generated questions
- Student answers
- AI feedback
- Review history

---

## BLE Study System

```sql
bluetooth_peers
challenges
```

Supports:

- Peer discovery
- Study sessions
- Offline competitions

---

# 🤖 AI Usage

Different LLM tools were used during planning and MVP development.

The final application runs AI locally on-device to prioritize:

- Privacy
- Accessibility
- Offline learning

---

# 👥 Contributors

- **Anjon Christian Paderez**
- **Francis Luiji Llanto**
- **Rob Godwin Raymundo**
