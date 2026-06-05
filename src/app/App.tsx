import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "@/features/auth/AuthPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TodayPage } from "@/features/dashboard/TodayPage";
import { RevisionsPage } from "@/features/revisions/RevisionsPage";
import { TopicsPage } from "@/features/topics/TopicsPage";

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="revisions" element={<RevisionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
