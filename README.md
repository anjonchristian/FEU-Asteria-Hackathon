# Author(s)
Anjon Christian Paderez
Francis Luiji Llanto
Rob Godwin Raymundo

# Setup Guide
Clone the repository
and run npx expo build:android or npx expo run:android for development build.

# 💡 Kahayag

Lightweight, zero online connectivity mobile learning platform for primary filipino students supports both android and ios

---

## Project Case: AI-Powered Study Companion for Filipino Learners

Project Kahayag(meaning light/brightness) tackles the core challenge of the Accenture TechSprint by eliminating the digital divide. By running a localized Small Language Model (SLM) directly on consumer hardware via llama.rn and introducing on-device OCR scanning, Kahayag acts as an infinite, smart study guide that requires zero data, zero Wi-Fi, and zero cloud costs.

With built in on device OCR for scanning physical textbooks and Bluetooth Low Energy (BLE) for peer-to-peer "Study Jams" or "Study off(competitive)" Kahayag ensures quality educational support is accessible to the majority of filipino students.

---

## ✨ Core Features

### Local On Device AI Tutor

Powered by llama.rn a 4-bit quantized SLM runs natively on the phone's CPU. It answers questions, gives hints, and acts as an interactive guide.

---

### Textbook Scanning through offline OCR

Students can snap photos of physical learning modules or worksheets. The app processes the image and extracts text entirely offline no cloud APIs required.

---

### Support for English and Filipino

The AI seamlessly understands and responds in English, Filipino, and conversational Taglish, removing language barriers for primary school students.

---

### Study Jam Sessions

Students can challenge nearby classmates to head to head educational duels or joint review sessions over Bluetooth Low Energy, gamifying the learning experience which is proven to be an effective motivator especially to young children.

---

### Adaptive and Personalized Mastery Loop

The application tracks correct and incorrect answers locally, creating a personalized learning metric that scales quiz difficulties dynamically based on student progression.

---

## 🛠️ Tech Stack and Dependencies

- llama.rn
- RN AI OCR text-recognition
- expo-camera
- expo-image-manipulator
- expo-fs
- expo-status-bar
- lucide
- native
- wind
- SQLte
- react-native-ml-kit/text-recognition

---

### Additional Dependencies

- @expo/ui
- @expo/vector-icons
- @react-navigation/bottom-tabs
- expo
- expo-camera
- expo-constants
- expo-device
- expo-font
- expo-glass-effect
- expo-haptics
- expo-image
- expo-linear-gradient
- expo-linking
- expo-router
- expo-splash-screen
- expo-status-bar
- expo-symbols
- expo-system-ui
- expo-web-browser
- lucide
- lucide-react-native
- nativewind
- react
- react-dom
- react-native
- react-native-gesture-handler
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-web
- react-native-worklets
- tailwindcss
- zustand
- to be updated

---

## 🗄️ Database Architecture SQLite(to be eligible for change)

### User Record

```sql
CREATE TABLE students (
    _id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade_level INTEGER NOT NULL,
    current_streak INTEGER DEFAULT 0,
    highest_streak INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Academic Node Infrastructure

```sql
CREATE TABLE subjects (
    _id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE topics (
    _id TEXT PRIMARY KEY,
    subject_id TEXT,
    name VARCHAR(255) NOT NULL,
    grade_level INTEGER NOT NULL,
    FOREIGN KEY(subject_id) REFERENCES subjects(_id)
);
```

---

### AI Adaptive Learning Brain

```sql
CREATE TABLE student_topic_mastery (
    student_id TEXT,
    topic_id TEXT,
    mastery_score INTEGER CHECK (mastery_score BETWEEN 0 AND 100),
    questions_attempted INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP,
    PRIMARY KEY(student_id, topic_id),
    FOREIGN KEY(student_id) REFERENCES students(_id),
    FOREIGN KEY(topic_id) REFERENCES topics(_id)
);
```

---

### Local Generative Question

```sql
CREATE TABLE session_history (
    _id TEXT PRIMARY KEY,
    student_id TEXT,
    topic_id TEXT,
    generated_question TEXT NOT NULL,
    student_answer VARCHAR(255),
    was_correct INTEGER CHECK (was_correct IN (0, 1)),
    ai_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(_id),
    FOREIGN KEY(topic_id) REFERENCES topics(_id)
);
```

---

### BLE Peer Mesh Cache

```sql
CREATE TABLE bluetooth_peers (
    _id TEXT PRIMARY KEY,
    bluetooth_uuid VARCHAR(255) UNIQUE NOT NULL,
    peer_name VARCHAR(255),
    last_connected_at TIMESTAMP
);
```

---

### Offline Challenge Ledger

```sql
CREATE TABLE challenges (
    _id TEXT PRIMARY KEY,
    challenger_id TEXT,
    opponent_type VARCHAR(50) CHECK (opponent_type IN ('AI', 'BLUETOOTH')),
    opponent_id TEXT NULL,
    topic_id TEXT,
    challenger_score INTEGER,
    opponent_score INTEGER NULL,
    status VARCHAR(50) CHECK (status IN ('COMPLETED', 'PENDING_SYNC')),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(challenger_id) REFERENCES students(_id),
    FOREIGN KEY(opponent_id) REFERENCES bluetooth_peers(_id),
    FOREIGN KEY(topic_id) REFERENCES topics(_id)
);
```

---

# AI Usage
This project has utilized different LLMs for planning, and vibecoding the MVP.

_Project Kahayag(meaning light/brightness) tackles the core challenge of the Accenture TechSprint by eliminating the digital divide._
