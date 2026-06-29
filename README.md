<p align="center">
  <img src="assets/images/github-icon.png" width="120" alt="Kahayag Logo"/>
</p>
<h1 align="center">Kahayag</h1>
<p align="center">
  <b>Lightweight mobile learning platform for Filipino students.</b><br/>
  Supports Android and iOS via Expo.
</p>

---

## 🎯 Project Overview

### AI-Powered Study Companion for Filipino Learners

**Project Kahayag** (meaning _light_ or _brightness_) is an intelligent learning companion designed for Filipino primary students.

It aims to tackle the digital divide by bringing personalized education support directly to mobile devices. For this MVP, we leverage the power of the **Google Gemini API** combined with on-device Text Recognition (OCR) to transform any physical textbook or worksheet into an interactive, bilingual learning experience. 

---

# ✨ Features

## 🧠 AI Tutor Powered by Gemini

Kahayag integrates the Google Gemini API to serve as a 24/7 personal tutor.

- **Subject-Specific Guardrails:** The tutor strictly restricts its answers to the subject you are currently studying.
- **Bilingual Support:** While the core app UI remains in English for digital literacy, the AI tutor and quiz generator can communicate in **English, Filipino, or Conversational Taglish** based on the student's preference.
- **Instant Explanations & Hints:** Get help with difficult problems step-by-step.

---

## 📸 Offline Textbook Scanner

Students can scan physical learning materials using built-in, completely offline OCR.

- Extracts text from physical textbooks and modules locally on the device using ML Kit.
- Sends the extracted text to the AI to instantly generate flashcards and quizzes.

---

## 🎮 Study Jam Sessions

A competitive multiplayer hub designed to make learning fun:

- **Host & Join Mechanics:** Easily host a Study Jam with an auto-filled (but customizable) host name.
- **Custom Battle Settings:** The host can dynamically configure the number of questions and the specific subject scope before starting the match.
- **Local Leaderboards:** Track who won recent jams directly on the home screen.

---

## 📈 Adaptive Grade Promotion System

Kahayag tracks progress natively using a powerful local storage engine.

- **Dynamic Grade Levels:** The system monitors your heatmap (active days), overall mastery percentage, and total quizzes completed.
- **Automated Level-Ups:** Once you hit specific consistency and mastery milestones, the app automatically notifies you and promotes you to the next Grade Level.
- **Comprehensive Dashboard:** View your 7-day flame streak, 30-day heatmap, and a fully real-time feed of your most recent activities (quizzes generated, jams played, and chats).

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

# Setup & Run

## 1. Clone & Install
```bash
git clone <repository-url>
cd kahayag
npm install
```

## 2. Environment Setup
Since this app uses the Google Gemini API, you need to provide your API key.
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## 3. Run the App
```bash
npm start
```
- **Android / iOS:** Scan the QR code using the **Expo Go** app on your physical device. 

---

# 🛠 Tech Stack

## Core Technology
- **Framework:** React Native / Expo (Expo Router)
- **AI Engine:** Google Gemini API (`@google/generative-ai`)
- **Styling:** React Native StyleSheet / Reanimated

## Local Device Integration
- **Text Recognition:** `@react-native-ml-kit/text-recognition` (Offline OCR)
- **State Management & Storage:** Zustand + AsyncStorage (Fully persistent offline profiles, activity heatmaps, and study vaults).

---

# 👥 Contributors

- **Anjon Christian Paderez**
- **Francis Luiji Llanto**
- **Rob Godwin Raymundo**
