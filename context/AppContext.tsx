import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import {
  AttendanceStatus,
  AttendanceState,
  HomeworkItem,
  HomeworkStore,
} from '@/types';
import { NAMES, HOMEWORK } from '@/constants/data';

// ─── State ──────────────────────────────────────────────
interface AppState {
  attendance: AttendanceState;
  homework: HomeworkStore;
  marksData: { [classId: string]: { [roll: number]: number } };
}

const initialState: AppState = {
  attendance: {},
  homework: {
    active: [...HOMEWORK.active],
    submitted: [...HOMEWORK.submitted],
    graded: [...HOMEWORK.graded],
  },
  marksData: {},
};

// ─── Actions ────────────────────────────────────────────
type AppAction =
  | { type: 'INIT_ATTENDANCE'; classId: string }
  | { type: 'SET_ATTENDANCE'; classId: string; roll: number; status: AttendanceStatus }
  | { type: 'MARK_ALL'; classId: string; status: 'P' | 'A' }
  | { type: 'ADD_HOMEWORK'; item: HomeworkItem }
  | { type: 'INIT_MARKS'; classId: string }
  | { type: 'SET_MARK'; classId: string; roll: number; score: number };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    case 'INIT_ATTENDANCE': {
      const { classId } = action;
      if (state.attendance[classId]) return state; // already init
      const names = NAMES[classId] || [];
      const newAtt: { [roll: number]: AttendanceStatus } = {};
      names.forEach((_, i) => {
        if (classId === '6B') {
          const r = Math.random();
          newAtt[i + 1] = r < 0.75 ? 'P' : r < 0.88 ? 'A' : 'L';
        } else {
          newAtt[i + 1] = null;
        }
      });
      return {
        ...state,
        attendance: { ...state.attendance, [classId]: newAtt },
      };
    }

    case 'SET_ATTENDANCE': {
      const { classId, roll, status } = action;
      const cls = { ...(state.attendance[classId] || {}) };
      cls[roll] = cls[roll] === status ? null : status;
      return {
        ...state,
        attendance: { ...state.attendance, [classId]: cls },
      };
    }

    case 'MARK_ALL': {
      const { classId, status } = action;
      const names = NAMES[classId] || [];
      const cls: { [roll: number]: AttendanceStatus } = {};
      names.forEach((_, i) => { cls[i + 1] = status; });
      return {
        ...state,
        attendance: { ...state.attendance, [classId]: cls },
      };
    }

    case 'ADD_HOMEWORK':
      return {
        ...state,
        homework: {
          ...state.homework,
          active: [action.item, ...state.homework.active],
        },
      };

    case 'INIT_MARKS': {
      const { classId } = action;
      if (state.marksData[classId]) return state;
      const names = NAMES[classId] || [];
      const data: { [roll: number]: number } = {};
      names.forEach((_, i) => { data[i + 1] = Math.floor(Math.random() * 21) + 30; });
      return {
        ...state,
        marksData: { ...state.marksData, [classId]: data },
      };
    }

    case 'SET_MARK': {
      const { classId, roll, score } = action;
      const cls = { ...(state.marksData[classId] || {}) };
      cls[roll] = score;
      return {
        ...state,
        marksData: { ...state.marksData, [classId]: cls },
      };
    }

    default:
      return state;
  }
}

// ─── Context Shape ──────────────────────────────────────
interface AppContextType {
  attendance: AttendanceState;
  homework: HomeworkStore;
  marksData: { [classId: string]: { [roll: number]: number } };
  // attendance actions
  initAttendance: (classId: string) => void;
  setAttendance: (classId: string, roll: number, status: AttendanceStatus) => void;
  markAll: (classId: string, status: 'P' | 'A') => void;
  // homework actions
  addHomework: (item: HomeworkItem) => void;
  // marks actions
  initMarks: (classId: string) => void;
  setMark: (classId: string, roll: number, score: number) => void;
}

// ─── Context ────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const initAttendance = useCallback((classId: string) => {
    dispatch({ type: 'INIT_ATTENDANCE', classId });
  }, []);

  const setAttendance = useCallback((classId: string, roll: number, status: AttendanceStatus) => {
    dispatch({ type: 'SET_ATTENDANCE', classId, roll, status });
  }, []);

  const markAll = useCallback((classId: string, status: 'P' | 'A') => {
    dispatch({ type: 'MARK_ALL', classId, status });
  }, []);

  const addHomework = useCallback((item: HomeworkItem) => {
    dispatch({ type: 'ADD_HOMEWORK', item });
  }, []);

  const initMarks = useCallback((classId: string) => {
    dispatch({ type: 'INIT_MARKS', classId });
  }, []);

  const setMark = useCallback((classId: string, roll: number, score: number) => {
    dispatch({ type: 'SET_MARK', classId, roll, score });
  }, []);

  const value: AppContextType = {
    attendance: state.attendance,
    homework: state.homework,
    marksData: state.marksData,
    initAttendance,
    setAttendance,
    markAll,
    addHomework,
    initMarks,
    setMark,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────
export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside <AppProvider>');
  }
  return ctx;
}
