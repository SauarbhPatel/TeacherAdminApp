# TeachDesk – React Native Expo App

A full-featured school teacher app built with **Expo SDK 54**, **Expo Router v4**, and **React Context API**.

---

## 📁 Project Structure

```
TeachDesk/
├── app/
│   ├── _layout.tsx                  # Root layout — wraps AuthProvider + AppProvider
│   ├── index.tsx                    # Smart redirect (login ↔ home)
│   ├── auth/
│   │   ├── login.tsx                # ✨ Login — calls real EduMug API
│   │   └── forgot-password.tsx      # Password reset flow
│   ├── tabs/
│   │   ├── _layout.tsx              # Bottom tab navigator
│   │   ├── index.tsx                # Home dashboard (uses AuthContext for name)
│   │   ├── attendance.tsx           # Tab shortcut → attendance screen
│   │   ├── homework.tsx             # Tab shortcut → homework screen
│   │   ├── schedule.tsx             # Tab shortcut → timetable screen
│   │   └── profile.tsx              # Profile — shows real API user data + logout
│   └── screens/
│       ├── attendance.tsx           # Full attendance marking
│       ├── attendance-confirm.tsx   # Summary after submit
│       ├── homework.tsx             # Homework list (Active/Submitted/Graded)
│       ├── add-homework.tsx         # Assign new homework form
│       ├── marks.tsx                # Gradebook editor
│       ├── timetable.tsx            # Day-by-day schedule
│       └── notices.tsx              # School notices
│
├── context/
│   ├── AuthContext.tsx              # ✨ Auth state — login/logout/persist session
│   └── AppContext.tsx               # ✨ App state — attendance, homework, marks
│
├── services/
│   ├── api.ts                       # ✨ EduMug API calls (staffLogin endpoint)
│   └── storage.ts                   # AsyncStorage helpers for session persistence
│
├── types/
│   └── index.ts                     # TypeScript types (AuthUser, StaffRecord, etc.)
│
├── components/ui/
│   ├── index.tsx                    # Card, Badge, Chip, PrimaryButton, AttPill
│   └── ScreenHeader.tsx             # Purple gradient header with back button
│
├── constants/
│   ├── theme.ts                     # Colors, Spacing, Radius, Shadow tokens
│   └── data.ts                      # Mock data (students, timetable, homework)
│
├── app.json                         # Expo config
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
cd TeachDesk
npm install
```

### 2. Start the dev server
```bash
npx expo start
```

Press `i` (iOS simulator), `a` (Android emulator), or scan the QR with **Expo Go**.

---

## 🔐 Login API

**Endpoint:** `POST https://edumug.in/api/home/stafflogin`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Request body:**
```json
{
  "username": "as@gmail.com",
  "password": "1234",
  "deviceToken": "EXPO_APP_TOKEN"
}
```

**Success response (status 1 / response_code 200):**
```json
{
  "status": 1,
  "message": "Login successful",
  "id": "598",
  "token": "OQOANQMQMQ",
  "role": "Class Teacher",
  "record": { "name": "Ajay Teacher", "email": "as@gmail.com", ... },
  "authtoken": "JWT_TOKEN",
  "response_code": 200
}
```

The `authtoken` (JWT) and full `record` are persisted via **AsyncStorage** so the user stays logged in across app restarts.

---

## 🏗️ Architecture — Context API

### `AuthContext` (context/AuthContext.tsx)
Manages authentication lifecycle:
- `user` — the logged-in `AuthUser` object (id, token, authtoken, role, record)
- `isLoggedIn` — derived boolean
- `isLoading` — true while AsyncStorage is being read on boot (shows spinner)
- `login(username, password)` — calls EduMug API, persists session
- `logout()` — clears AsyncStorage, resets state

Uses `useReducer` internally with `HYDRATE | LOGIN_SUCCESS | LOGOUT` actions.

### `AppContext` (context/AppContext.tsx)
Manages all in-app data:
- Attendance state per class (P/A/L/null per student roll)
- Homework lists (active/submitted/graded)
- Marks per class per student
- All mutations dispatched via `useReducer` for predictable updates

### Provider tree (app/_layout.tsx)
```
<GestureHandlerRootView>
  <SafeAreaProvider>
    <AuthProvider>          ← auth state
      <AppProvider>         ← app data state
        <RootNavigator />   ← reads isLoggedIn to gate routes
      </AppProvider>
    </AuthProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

---

## ✨ Features

| Screen               | Description                                        |
|----------------------|----------------------------------------------------|
| **Login**            | Real API auth with loading state, shake on error   |
| **Forgot Password**  | Email-based reset flow (UI complete)               |
| **Home Dashboard**   | Live teacher name from API, stats, feature grid    |
| **Attendance**       | Mark P/A/L per student, progress bar, submit       |
| **Attendance Confirm** | Summary with absent list, parent notify toggle   |
| **Homework**         | Tabbed list with status chips                      |
| **Add Homework**     | Form to assign new tasks, updates context          |
| **Marks / Gradebook**| Editable scores, auto A/B/C/D grading              |
| **Timetable**        | Day tabs, free periods highlighted                 |
| **Notices**          | Colour-coded urgent/event/general notices          |
| **Profile**          | Real data from API response, secure logout         |

---

## 🧰 Tech Stack

| Library | Purpose |
|---------|---------|
| Expo SDK 54 | App platform |
| Expo Router v4 | File-based navigation |
| React 18 + Context API | State management (no Zustand) |
| useReducer | Predictable state updates |
| AsyncStorage | Persist auth session across restarts |
| expo-linear-gradient | Gradient UI elements |
| TypeScript | Full type safety |

