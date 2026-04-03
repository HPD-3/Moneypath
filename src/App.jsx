import { Routes, Route, Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useAuth } from "./context/AuthContext.jsx";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import LandingPage from "./pages/Landing";
import Register from "./pages/Register";
import Personal from "./pages/Personal.jsx";
import Profile from "./pages/Profile.jsx";
import Balance from "./pages/Balance.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import VideoEdukasi from "./pages/VideoEdukasi.jsx";
import LearningPathList from "./pages/LearningPathList.jsx";
import LearningPathDetail from "./pages/LearningPathDetail.jsx";
import DailyQuiz from "./pages/DailyQuiz.jsx";
import Tabungan from "./pages/Tabungan.jsx";
import Email from "./pages/send.jsx";
import RekapBulanan from "./pages/RekapBulanan.jsx";
import SharedBalance from "./pages/SharedBalance.jsx";

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

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}


function App() {
  return (
    <Routes>

      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
  );
}

export default App;