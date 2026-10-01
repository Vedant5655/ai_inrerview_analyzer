import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Loading } from './components/common/UI';

const Landing = lazy(() => import('./pages/Landing'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateInterview = lazy(() => import('./pages/CreateInterview'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));
const InterviewResult = lazy(() => import('./pages/InterviewResult'));
const Feedback = lazy(() => import('./pages/Feedback'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function AuthEntry({ mode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage mode={mode} />;
}

export default function App() {
  return <Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<AuthEntry mode="login" />} />
    <Route path="/register" element={<AuthEntry mode="register" />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/interview/new" element={<CreateInterview />} />
      <Route path="/interview/:id" element={<InterviewSession />} />
      <Route path="/interview/:id/result" element={<InterviewResult />} />
      <Route path="/interview/:id/feedback" element={<Feedback />} />
      <Route path="/history" element={<History />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
