import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "./context/AuthContext.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const LandingPage = lazy(() => import("./pages/Landing"));
const Register = lazy(() => import("./pages/Register"));
const Personal = lazy(() => import("./pages/Personal.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Balance = lazy(() => import("./pages/Balance.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/adminDashboard.jsx"));
const VideoEdukasi = lazy(() => import("./pages/VideoEdukasi.jsx"));
const LearningPathList = lazy(() => import("./pages/LearningPathList.jsx"));
const LearningPathDetail = lazy(() => import("./pages/LearningPathDetail.jsx"));
const DailyQuiz = lazy(() => import("./pages/DailyQuiz.jsx"));
const Tabungan = lazy(() => import("./pages/Tabungan.jsx"));
const Email = lazy(() => import("./pages/send.jsx"));
const RekapBulanan = lazy(() => import("./pages/RekapBulanan.jsx"));
const SharedBalance = lazy(() => import("./pages/SharedBalance.jsx"));
const SharedTabungan = lazy(() => import("./pages/SharedTabungan.jsx"));

function LoadingFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f0" }}>
      <div style={{ textAlign: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #9FF782", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Memuat...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f0" }}>
      <div style={{ textAlign: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #9FF782", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Memuat...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;


  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}


function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>

        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/send" element={<Email />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/personal" element={
          <ProtectedRoute><Personal /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/balance" element={
          <ProtectedRoute><Balance /></ProtectedRoute>
        } />
        <Route path="/tabungan" element={
          <ProtectedRoute><Tabungan /></ProtectedRoute>
        } />
        <Route path="/quiz" element={
          <ProtectedRoute><DailyQuiz /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="/shared-balance" element={<ProtectedRoute><SharedBalance /></ProtectedRoute>} />
        <Route path="/shared-tabungan" element={<ProtectedRoute><SharedTabungan /></ProtectedRoute>} />
        <Route path="/video" element={
          <ProtectedRoute><VideoEdukasi /></ProtectedRoute>
        } />

        <Route path="/rekap" element={
          <RekapBulanan />
        } />

        <Route path="/learning" element={
          <ProtectedRoute><LearningPathList /></ProtectedRoute>
        } />

        <Route path="/learning/:pathId" element={
          <ProtectedRoute><LearningPathDetail /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;