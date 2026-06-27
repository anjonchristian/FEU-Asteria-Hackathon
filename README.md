<p align="center">
  <img src="assets/images/github-icon.png" width="120" alt="Kahayag Logo"/>
</p>
<h1 align="center">Kahayag</h1>
<p align="center">
  <b>Lightweight, zero-connectivity mobile learning platform for Filipino students.</b><br/>
  Supports Android and iOS.
</p>

## AI-Powered Study Companion for Filipino Learners

**Project Kahayag** (*meaning “light” or “brightness”*) is an offline-first AI learning companion designed for Filipino primary students.

It addresses the digital divide by providing personalized educational support directly on mobile devices with:

* No internet dependency
* No cloud infrastructure costs
* No required data connection

By running a localized **Small Language Model (SLM)** through `llama.rn` and integrating offline OCR technology, Kahayag transforms a smartphone into an intelligent study assistant available anytime, anywhere.

---

# Features

## Local AI Tutor

Kahayag runs a 4-bit quantized Small Language Model directly on the device using `llama.rn`.

Capabilities:

* AI-generated explanations
* Question answering
* Study guidance
* Practice question generation
* Offline tutoring support

---

## Offline Textbook Scanner

Students can scan physical learning materials using built-in OCR technology.

Features:

* Extracts text from images
* Fully offline processing
* Supports textbooks, modules, and worksheets
* No cloud OCR services required

---

## Filipino and English Support

Kahayag supports:

* English
* Filipino
* Conversational Taglish

This allows students to learn using familiar and accessible language.

---

## Study Jam Sessions

Using Bluetooth Low Energy (BLE), students can:

* Join peer learning sessions
* Challenge classmates
* Participate in educational quizzes
* Study together without internet access

---

## Adaptive Learning System

Kahayag tracks student progress locally.

The system:

* Records learning activity
* Measures topic mastery
* Adjusts difficulty levels
* Builds personalized learning paths

---

# Installation

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

# Setup

Clone the repository:

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

After the application loads:

```text
Enable Airplane Mode to verify offline functionality.
```

---

## Option 2 — Development Build

Required for native functionality:

* `llama.rn`
* OCR
* Bluetooth Low Energy

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

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `npm start`             | Start Expo development server |
| `npm run android`       | Run Android build             |
| `npm run ios`           | Run iOS build                 |
| `npm run lint`          | Run linter                    |
| `npm run reset-project` | Reset project configuration   |

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

# Technology Stack

## Artificial Intelligence

* `llama.rn`
* Local Small Language Model
* 4-bit quantization

## Mobile Development

* React Native
* Expo
* Expo Router

## OCR

* `react-native-ml-kit/text-recognition`

## Database

* SQLite

## UI Framework

* NativeWind / TailwindCSS
* Lucide Icons

## State Management

* Zustand

## Connectivity

* Bluetooth Low Energy (BLE)

---

# Database Architecture

Kahayag uses SQLite for fully offline data storage.

## Student Records

```sql
students
```

Stores:

* Student profile
* Grade level
* Experience points
* Learning streaks

---

## Academic Structure

```sql
subjects
topics
student_topic_mastery
```

Handles:

* Subjects
* Topics
* Mastery tracking
* Learning progress

---

## AI Learning History

```sql
session_history
```

Stores:

* Generated questions
* Student responses
* AI feedback
* Review history

---

## BLE Study System

```sql
bluetooth_peers
challenges
```

Supports:

* Peer discovery
* Offline study sessions
* Learning competitions

---

# AI Implementation

AI tools were used during planning and MVP development.

The final application runs AI locally on-device to prioritize:

* Student privacy
* Accessibility
* Offline learning

---

# Contributors

* **Anjon Christian Paderez**
* **Francis Luiji Llanto**
* **Rob Godwin Raymundo**

