# TeachDesk — Codebase Pattern Guide
> Reference document for maintaining consistent code style across all future updates.

---

## 1. PROJECT OVERVIEW

**App:** TeachDesk — A React Native Expo app for school teachers.  
**Stack:** Expo SDK 54, Expo Router v6, React 19, TypeScript, Context API + useReducer  
**API:** EduMug (`https://edumug.in/api`)  
**Target:** Android + iOS (portrait only)

---

## 2. FOLDER STRUCTURE

```
app/
  _layout.tsx              ← Root layout, all providers, Stack navigator
  index.tsx                ← Smart redirect (login ↔ /tabs)
  auth/
    login.tsx
    forgot-password.tsx
  tabs/
    _layout.tsx            ← Bottom tab navigator (5 tabs)
    index.tsx              ← Home dashboard
    attendance.tsx         ← Redirects to /screens/attendance
    homework.tsx           ← Redirects to /screens/homework (commented out)
    schedule.tsx           ← Redirects to /screens/timetable (commented out)
    profile.tsx            ← Profile screen (inline, no redirect)
  screens/
    attendance.tsx         ← Daily overview, date strip, class cards
    attendance-mark.tsx    ← Per-class student marking
    attendance-confirm.tsx ← Summary after submit
    homework.tsx           ← Tabbed homework list
    add-homework.tsx       ← Add homework form
    marks.tsx              ← Simple local marks editor (legacy)
    marks-entry.tsx        ← 3-step selector (Class → Section → Exam)
    marks-students.tsx     ← Student list + subject-wise marks grid
    marks-form.tsx         ← Per-student subject marks editor
    exam.tsx               ← Exam hub (feature cards)
    timetable.tsx          ← Day-by-day schedule
    notices.tsx            ← School announcements

components/ui/
  index.tsx                ← Card, Badge, Chip, PrimaryButton, SectionLabel, AttPill
  ScreenHeader.tsx         ← Reusable purple gradient header with back button

context/
  AuthContext.tsx          ← Auth state: user, isLoggedIn, isLoading, login, logout
  AppContext.tsx           ← App state: attendance, homework, marks

services/
  api.ts                   ← All API calls (EduMug)
  storage.ts               ← AsyncStorage helpers for auth persistence

types/
  index.ts                 ← All TypeScript interfaces

constants/
  theme.ts                 ← Colors, Spacing, Radius, Shadow tokens
  data.ts                  ← Mock/static data (NAMES, CLASSES, TIMETABLE, etc.)
```

---

## 3. NAVIGATION PATTERN

- **Expo Router** with file-based routing
- **Provider tree** (in `app/_layout.tsx`):
  ```
  GestureHandlerRootView
    SafeAreaProvider
      StatusBar
      AuthProvider
        AppProvider
          RootNavigator  ← Stack, gates auth vs app routes
  ```
- **Auth gate**: `RootNavigator` checks `isLoggedIn` to show either auth screens or app screens
- **Tab redirects**: Some tab files use `router.replace('/screens/...')` in `useEffect` to redirect to a full screen. Others (profile) render inline.
- **Navigation calls**: Always `router.push(...)` for forward, `router.back()` for back, `router.replace(...)` for tab redirects
- **Typed routes**: `router.push('/screens/marks-entry' as any)` — cast with `as any` when needed

---

## 4. THEMING SYSTEM (`constants/theme.ts`)

### Colors
```ts
Colors.purple         // #6722d5  — primary brand
Colors.purpleDark     // #4e17a8
Colors.purpleDeeper   // #3a0f80  — gradient end
Colors.purpleLight    // #8b4ee0
Colors.purpleBg       // #f0e8fd  — light purple tint bg
Colors.purplePale     // #f7f2ff  — very light input focus bg

Colors.green / greenBg / greenText
Colors.red / redBg / redText
Colors.amber / amberBg / amberText
Colors.blue / blueBg / blueText
Colors.pink / pinkBg
Colors.teal / tealBg

Colors.surface        // #f8f6ff  — page background
Colors.card           // #ffffff  — card background
Colors.border         // #e9e3f7  — borders

Colors.text1          // #1a0533  — primary text
Colors.text2          // #6b5e8a  — secondary text
Colors.text3          // #a89ec0  — placeholder/muted text
```

### Spacing (use always, never raw numbers)
```ts
Spacing.xs = 4
Spacing.sm = 8
Spacing.md = 12
Spacing.lg = 16
Spacing.xl = 20
Spacing.xxl = 24
Spacing.xxxl = 32
```

### Radius
```ts
Radius.sm = 8 | Radius.md = 12 | Radius.lg = 16
Radius.xl = 18 | Radius.xxl = 24 | Radius.full = 999
```

### Shadow (always use one of these, never custom shadows)
```ts
Shadow.sm  // subtle, elevation 3
Shadow.md  // stronger, elevation 6
```

---

## 5. HEADER PATTERNS

### Pattern A — `ScreenHeader` component (simple screens)
Used in: `homework.tsx`, `add-homework.tsx`, `marks.tsx`, `notices.tsx`, `timetable.tsx`, `attendance-confirm.tsx`
```tsx
import { ScreenHeader } from '@/components/ui/ScreenHeader';
<ScreenHeader title="Page Title" subtitle="Subtitle text" />
// Optional: rightElement, onBack
```
- Purple gradient background auto-applied
- Back button built-in (goes back or replaces to /tabs)
- Decorative circles built-in

### Pattern B — Inline `LinearGradient` header (complex screens)
Used in: `attendance.tsx`, `attendance-mark.tsx`, `marks-entry.tsx`, `marks-students.tsx`, `marks-form.tsx`, `exam.tsx`, `profile.tsx`

Structure always:
```tsx
<LinearGradient
  colors={[Colors.purple, Colors.purpleDeeper]}
  style={[styles.header, { paddingTop: insets.top + 14 }]}
>
  <View style={styles.decor1} />   {/* decorative circle, top-right */}
  <View style={styles.decor2} />   {/* decorative circle, bottom-left */}

  {/* Back button row */}
  <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>

  {/* Title area */}
  <Text style={styles.title}>...</Text>
  <Text style={styles.sub}>...</Text>

  {/* Optional: date strip, stat pills, step bar, breadcrumbs */}
</LinearGradient>
```

Back button style (always consistent):
```ts
backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }
backArrow: { color: '#fff', fontSize: 18, fontWeight: '700' }
```

Decorative circles (always consistent):
```ts
decor1: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' }
decor2: { position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' }
```

---

## 6. CARD PATTERNS

### Standard list card
```ts
cardStyle: {
  backgroundColor: Colors.card,
  borderRadius: Radius.lg,  // or Radius.xl
  padding: Spacing.lg,
  ...Shadow.sm,
  borderWidth: 1,
  borderColor: Colors.border,
  marginBottom: 8 or 10,
}
```

### Accent left-border card (used in marks-entry, attendance-mark)
```ts
{ ...cardStyle, borderLeftWidth: 4, borderLeftColor: ACCENT[i % ACCENT.length] }
```

### Color-tinted feature card (used in exam.tsx, home index.tsx)
```ts
{ backgroundColor: feat.bg, borderColor: feat.border, borderWidth: 1.5, borderRadius: Radius.xl }
```

---

## 7. UI COMPONENTS (`components/ui/index.tsx`)

All exported from `@/components/ui`:

| Component | Props | Usage |
|-----------|-------|-------|
| `Card` | `children, style?` | Wrapper with card styling |
| `Badge` | `label, variant?` | Color pill: purple/green/red/amber/blue/gray |
| `Chip` | `label, active?, onPress?, style?` | Tab/filter chip, active = purple |
| `PrimaryButton` | `label, onPress, color?, style?, textStyle?, icon?` | Full-width CTA button |
| `SectionLabel` | `label, style?` | ALL CAPS section header |
| `AttPill` | `status, type, onPress` | P/A/L attendance toggle pill |

---

## 8. STATE MANAGEMENT PATTERNS

### AuthContext
```ts
user: AuthUser | null     // { id, token, authtoken, role, record: StaffRecord }
isLoggedIn: boolean
isLoading: boolean        // true while AsyncStorage hydrating on boot
login(username, password) → Promise<{ success, error? }>
logout() → void
```

Access: `const { user } = useAuth();`  
Token: `user.token` (short token) or `user.authtoken` (JWT)  
School ID: `user.record.school_id`  
Session ID: `(user.record as any).session_id ?? null`  

### AppContext (local mock data state)
```ts
attendance: AttendanceState   // { [classId]: { [roll]: 'P'|'A'|'L'|null } }
homework: HomeworkStore       // { active, submitted, graded }
marksData: { [classId]: { [roll]: number } }
// Actions:
initAttendance(classId), setAttendance(classId, roll, status), markAll(classId, status)
addHomework(item)
initMarks(classId), setMark(classId, roll, score)
```

Access: `const { attendance } = useAppContext();`

---

## 9. API PATTERNS (`services/api.ts`)

### Base config
```ts
BASE_URL = 'https://edumug.in/api'
DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Client-Service': 'smartschool',
  'Auth-Key': 'schoolAdmin@',
  token: '<static JWT>',
}
```

### `buildHeaders(token?, school_id?)` 
Always used for authenticated calls. Adds:
- `Authorization: Bearer ${token}`
- `token: ${token}`
- `Schoolid: ${school_id}` (if provided)

### `apiFetch<T>(path, options)` — internal helper
- Prepends BASE_URL
- Merges DEFAULT_HEADERS
- Parses JSON, throws on `!response.ok`

### Existing API functions
| Function | Method | Endpoint |
|----------|--------|----------|
| `staffLogin(payload)` | POST | `/home/stafflogin` |
| `getDailyAttendance(date, token, school_id)` | POST | `/attendance/get_daily_attendance` |
| `getAttendanceTypes(token, school_id)` | GET | `/attendance/get_attendance_type` |
| `saveAttendance(payload, token, school_id)` | POST | `/attendance/save_attendance` |
| `getClasswiseAttendance(payload, token, school_id)` | POST | `/attendance/get_classwise_attendance` |
| `getClassSectionList(token, school_id)` | GET | `/webservice/getClassSectionList` |
| `getClassExamList(payload, token)` | POST | `/Webservice/getClassExamList` |
| `getClassSectionMarksheet(payload, token)` | POST | `/Webservice/getClassSectionMarksheet` |
| `saveStudentMarksEntry(payload, token)` | POST | `/Webservice/saveStudentMarksEntry` |

### Standard API call pattern in screens
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const fetchData = useCallback(async (silent = false) => {
  if (!user?.token) return;
  if (!silent) { setLoading(true); setError(''); }
  try {
    const res = await someApiCall(token, school_id);
    if (res.response_code === 200) {
      setData(res.data ?? []);
    } else {
      setError(res.response_message || 'Failed to load.');
    }
  } catch (e: any) {
    setError(e?.message || 'Network error.');
  } finally {
    setLoading(false);
  }
}, [user?.token]);

useEffect(() => { fetchData(); }, [fetchData]);
```

### API response shape (always check `response_code === 200`)
```ts
{ response_code: number, response_message: string, data: T }
```

---

## 10. LOADING / ERROR / EMPTY STATE PATTERNS

These three states appear on every data-driven screen. Always follow this exact structure:

### Loading
```tsx
<View style={styles.centered}>
  <ActivityIndicator size="large" color={Colors.purple} />
  <Text style={styles.loadTxt}>Loading…</Text>
</View>
```

### Error + Retry
```tsx
<View style={styles.centered}>
  <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
  <Text style={styles.errTitle}>Could not load data</Text>
  <Text style={styles.errMsg}>{error}</Text>
  <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()} activeOpacity={0.8}>
    <Text style={styles.retryTxt}>Try Again</Text>
  </TouchableOpacity>
</View>
```

### Empty list
```tsx
<View style={styles.emptyWrap}>
  <Text style={{ fontSize: 36, marginBottom: 10 }}>📭</Text>
  <Text style={{ color: Colors.text3, fontSize: 14 }}>No items found</Text>
</View>
```

### Styles for above (consistent across screens)
```ts
centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }
loadTxt: { marginTop: 12, fontSize: 14, color: Colors.text3 }
errTitle: { fontSize: 16, fontWeight: '700', color: Colors.text1, marginBottom: 6 }
errMsg: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 }
retryBtn: { marginTop: 16, backgroundColor: Colors.purple, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }
retryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 }
emptyWrap: { alignItems: 'center', paddingTop: 60 }
```

---

## 11. SAVE TOAST PATTERN

Used in `attendance-mark.tsx`, `marks-form.tsx`, `marks-students.tsx`. Always identical:

```tsx
function SaveToast({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 180/200, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[toastS.wrap, { opacity }]} pointerEvents="none">
      <Text style={toastS.text}>✓  Attendance/Marks saved</Text>
    </Animated.View>
  );
}
```

Flash helper pattern:
```ts
const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const flashToast = useCallback(() => {
  if (toastTimer.current) clearTimeout(toastTimer.current);
  setShowToast(true);
  toastTimer.current = setTimeout(() => setShowToast(false), 1800);
}, []);
```

Toast is always rendered at the bottom of the screen JSX, outside the ScrollView, absolutely positioned.

---

## 12. SEARCH + SORT PATTERN

Established in `marks-students.tsx`. Used in both Student-wise AND Subject-wise tabs.

### State
```ts
const [search, setSearch] = useState('');
const [sortKey, setSortKey] = useState<SortKey>('name_asc');
```

### Sort options type
```ts
type SortKey = 'name_asc' | 'name_desc' | 'adm_asc' | 'pct_high' | 'pct_low';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name_asc', label: 'Name A→Z' },
  { key: 'name_desc', label: 'Name Z→A' },
  { key: 'adm_asc', label: 'Adm. No.' },
  { key: 'pct_high', label: '% High' },
  { key: 'pct_low', label: '% Low' },
];
```

### Filter + sort memo
```ts
const processed = useMemo(() => {
  const filtered = students.filter(s =>
    !search ||
    s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no.toLowerCase().includes(search.toLowerCase())
  );
  return sortStudents(filtered, sortKey);
}, [students, search, sortKey]);
```

### Controls block JSX (always same structure)
```tsx
<View style={styles.controlsWrap}>
  {/* Search bar */}
  <View style={styles.searchBar}>
    <Text style={{ fontSize: 15 }}>🔍</Text>
    <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
      placeholder="Search by name or admission no…" placeholderTextColor={Colors.text3} />
    {search ? (
      <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
        <Text style={{ color: Colors.text3, fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    ) : null}
  </View>
  {/* Sort chips */}
  <View style={styles.sortRow}>
    <Text style={styles.sortLabel}>Sort by:</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {SORT_OPTIONS.map(opt => (
        <TouchableOpacity key={opt.key}
          style={[styles.sortChip, sortKey === opt.key && styles.sortChipActive]}
          onPress={() => setSortKey(opt.key)} activeOpacity={0.8}>
          <Text style={[styles.sortChipTxt, sortKey === opt.key && styles.sortChipTxtActive]}>
            {sortKey === opt.key ? '✓ ' : ''}{opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</View>
```

---

## 13. REFRESH CONTROL PATTERN

Used on scrollable screens with live API data:
```tsx
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
  }
>
```
```ts
const onRefresh = () => { setRefreshing(true); fetchData(true); };
// fetchData(silent=true) skips setLoading(true) so list stays visible during refresh
```

---

## 14. MULTI-STEP SELECTOR PATTERN (`marks-entry.tsx`)

Used for Class → Section → Exam selection:
- `StepBar` component shows numbered progress (1/2/3)
- `Pill` component shows selected values as dismissible breadcrumbs
- `resetFrom(step)` clears downstream selections
- Data loads lazily: classes on mount, exams only when step 3 opens
- Each step has its own loading/error state (`clsLoading`, `exmLoading`, etc.)

---

## 15. MARKS SCREENS FLOW

```
exam.tsx
  └─ marks-entry.tsx      (3-step: Class → Section → Exam)
       └─ marks-students.tsx   (Student-wise tab + Subject-wise tab)
            └─ marks-form.tsx  (Per-student, per-subject editor)
```

### marks-students.tsx architecture
- Two tabs: `student` | `subject` (state: `activeTab`)
- Search + sort live in both tabs (student-wise: main screen state; subject-wise: inside `SubjectWiseTab` component)
- `SubjectWiseTab` is a self-contained component receiving `{ students, params, user, onToast }` props
- Subject chip strip (horizontal scroll) selects active subject
- Gradient banner updates color per selected subject using `SUBJECT_COLORS` array
- Auto-save on `TextInput` blur, optimistic UI, save indicator (✓ in avatar)

### Grade calculation (shared logic)
```ts
function calcGrade(obtained: number, max: number) {
  const p = (obtained / max) * 100;
  return {
    pct: p.toFixed(1),
    grade: p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2'
         : p >= 51 ? 'C1' : p >= 41 ? 'C2' : 'D',
    gp: p >= 91 ? '10.0' : p >= 81 ? '9.0' : ... : '4.0',
  };
}
```

---

## 16. ATTENDANCE SCREENS FLOW

```
attendance.tsx          (daily overview, date strip, class cards)
  └─ attendance-mark.tsx     (per-class student marking)
       └─ attendance-confirm.tsx  (summary, not currently navigated to)
```

### attendance-mark.tsx architecture
- Loads student list + attendance types in parallel (`Promise.all`)
- `LocalStudent` extends API type with `local_type_id`, `saving`, `saved`, `dirty`
- `handleTypePress` → optimistic UI update → `saveOne` API call
- Bulk mark triggers `Alert.alert` confirmation → loops all students
- Footer submit button checks for unmarked students → prompts bulk mark as Present
- Progress bar (`progress = savedCount / students.length * 100`)
- `TYPE_CFG` maps API type id → UI colors: `'1'=Present, '3'=Leave, '4'=Absent, '5'=Holiday`

---

## 17. ATTENDANCE DATE STRIP PATTERN

Used in `attendance.tsx` and `home/index.tsx`:
```ts
const weekDates = useMemo(() => {
  const today = todayISO();  // new Date().toISOString().split('T')[0]
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(today, i - 3);  // 3 days before, today, 3 days after
    const d = new Date(iso + 'T00:00:00');
    return { iso, day: DAYS[d.getDay()], num: d.getDate(), isToday: iso === today };
  });
}, []);
```

Selected date chip styling:
- `dateChipToday`: semi-transparent white bg
- `dateChipSel`: full white bg, text becomes `Colors.purple`

---

## 18. COLOR ACCENT ROTATION PATTERN

Used in `marks-entry.tsx` and `marks-students.tsx` for visual variety:
```ts
const ACCENT = [Colors.purple, Colors.blue, Colors.green, Colors.amber, Colors.pink, Colors.teal, '#7c3aed', '#0891b2', '#d97706'];
// Usage:
{ borderLeftColor: ACCENT[i % ACCENT.length] }
{ backgroundColor: ACCENT[i % ACCENT.length] + '18' }  // 18 = ~10% opacity hex
```

Subject colors array in `marks-students.tsx` has `{ bg, color, border, grad }` objects for richer per-subject theming.

---

## 19. BOTTOM ACTION STRIP PATTERN

Used in `homework.tsx`, `add-homework.tsx`, `marks.tsx`, `attendance-mark.tsx`, `marks-form.tsx`:
```tsx
<View style={styles.addStrip}>  {/* or btnStrip, footer */}
  <PrimaryButton label="Action Label" onPress={handler} />
</View>
```
```ts
addStrip: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border }
```

---

## 20. FORM FIELD PATTERN (`add-homework.tsx`, `marks-form.tsx`)

```tsx
<View style={styles.fieldWrap}>
  <Text style={styles.label}>Field Label</Text>
  <TextInput style={styles.input} value={val} onChangeText={setVal}
    placeholder="placeholder" placeholderTextColor={Colors.text3} />
</View>
```
```ts
fieldWrap: { marginBottom: 18 }
label: { fontSize: 11, fontWeight: '700', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }
input: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, padding: 12, fontSize: 14, color: Colors.text1 }
```

Focus state: `borderColor: Colors.purple, backgroundColor: Colors.purplePale`

---

## 21. TAB SELECTOR PATTERN

### Top chip tabs (`Chip` component from ui/index.tsx)
Used in `homework.tsx`, `marks.tsx`:
```tsx
<View style={styles.tabsRow}>
  {TABS.map(t => (
    <Chip key={t.id} label={t.label} active={tab === t.id} onPress={() => setTab(t.id)} style={{ flex: 1 }} />
  ))}
</View>
```
```ts
tabsRow: { flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface }
```

### Underline tabs (custom)
Used in `marks-students.tsx`:
```ts
tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' }
tabActive: { borderBottomColor: Colors.purple }
tabTxt: { fontSize: 13, fontWeight: '600', color: Colors.text3 }
tabTxtActive: { color: Colors.purple, fontWeight: '800' }
```

---

## 22. PROFILE SCREEN PATTERNS

- Uses `user.record` from `AuthContext` for real data
- Initials: `record.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()`
- Stats row: 3 `Card` components side-by-side with `flex: 1`
- Menu items: `TouchableOpacity` rows with icon wrap, label, sub, chevron `›`
- Logout: `Alert.alert` confirmation → `logout()` → `router.replace('/auth/login')`
- Shows truncated token (dev helper)

---

## 23. SAFE AREA PATTERN

Every screen uses:
```tsx
const insets = useSafeAreaInsets();
// Applied on outermost View:
<View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
// OR on header directly:
style={[styles.header, { paddingTop: insets.top + 14 }]}
```

---

## 24. TYPESCRIPT CONVENTIONS

- All types/interfaces in `types/index.ts`
- API response types: `XxxResponse` (e.g. `LoginResponse`, `DailyAttendanceResponse`)
- Payload types: `XxxPayload`
- Local UI types defined inline in screen file (e.g. `LocalStudent`, `SortKey`, `Step`)
- `(user.record as any).session_id` — used when field might not exist on type
- Always `?? null` or `?? []` or `?? ''` fallbacks on optional fields

---

## 25. MOCK DATA (`constants/data.ts`)

Used as fallback / demo data:
- `TEACHER` — static teacher info
- `CLASSES` — `{ '5A': { name, subject, count, time, icon } }`
- `NAMES` — `{ '5A': string[], '6B': string[], '4C': string[] }`
- `TIMETABLE` — `{ Mon: [{time, cls, sub, room, icon, color, free?}] }`
- `HOMEWORK` — `{ active: [], submitted: [], graded: [] }`
- `NOTICES` — `[{ type, tag, title, body, date }]`
- `MARKS_CLASSES`, `MARKS_SECTIONS`, `MOCK_EXAMS`, `MOCK_SUBJECTS` — marks demo data
- `getMockMarksStudents(classId, sectionId, className, sectionName, examId)` — generates fake student marksheets

---

## 26. ICON / EMOJI CONVENTIONS

- Back button: `←` (text, not icon library)
- Refresh: `↻`
- Chevron/arrow: `›`
- Close/clear: `✕`
- Saved indicator: `✓`
- Feature icons: emoji strings (`✅`, `📚`, `📊`, `🗓️`, `👤`, `🔔`, etc.)
- Status: `📭` for empty, `⚠️` for error, `🎉` for full attendance

No `@expo/vector-icons` used in screens — emoji only.

---

## 27. KEY RULES TO FOLLOW IN FUTURE UPDATES

1. **Never change UI** unless explicitly asked — add features alongside existing code
2. **Reuse shared styles** — if a style exists in `styles`, use it; don't duplicate
3. **Follow the loading/error/empty triple pattern** on every new data screen
4. **Always use `Colors.*`, `Spacing.*`, `Radius.*`, `Shadow.*`** — never raw hex/numbers
5. **API calls always use `buildHeaders(token, school_id)`** for authenticated endpoints
6. **Check `response_code === 200`** not `response.ok` for API success
7. **Optimistic UI first, revert on failure** for save operations
8. **`useCallback` on all async handlers** that are passed as props or used in `useEffect`
9. **`useMemo` on all filtered/sorted/derived lists**
10. **`silent = false` param on fetch functions** for pull-to-refresh without full loading state
11. **Sub-components defined above the main screen export** in the same file (e.g. `StepBar`, `Pill`, `SubjectWiseTab`, `SaveToast`)
12. **StyleSheet at the bottom** of the file, after all component definitions
13. **Two StyleSheet objects when needed**: main `styles` + component-specific (e.g. `sw`, `bar`, `badge`, `pill`, `srow`, `toast`)
14. **`as any` cast** for `router.push` paths that aren't in typed routes
15. **`session_id: (user.record as any).session_id ?? null`** fallback pattern for missing fields
