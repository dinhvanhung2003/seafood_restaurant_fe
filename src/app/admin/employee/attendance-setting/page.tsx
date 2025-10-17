// ✅ SERVER COMPONENT
export const dynamic = "force-dynamic"; // Ngăn prerender tĩnh (cần cho map)
export const revalidate = 0;

import AttendanceSettings from "./AttendanceSettings";

export default function Page() {
  return <AttendanceSettings />;
}
