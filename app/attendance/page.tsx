import SessionTracker from "@/components/attendance/SessionTracker";

export const metadata = {
  title: "Employee Attendance Tracker | Bricks",
  description: "Daily 4-session employee attendance mark-in system.",
};

export default function AttendancePage() {
  return <SessionTracker />;
}
