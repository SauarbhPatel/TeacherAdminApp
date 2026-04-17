import { useEffect } from 'react';
import { router } from 'expo-router';

// This tab redirects to the attendance screen
export default function AttendanceTab() {
  useEffect(() => {
    router.replace('/screens/attendance');
  }, []);
  return null;
}
