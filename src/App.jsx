import { Routes, Route, Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import LandingPage from "./pages/Landing";
import Register from "./pages/Register";
import Personal from "./pages/Personal.jsx";
import Balance from "./pages/Balance.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import VideoEdukasi from "./pages/VideoEdukasi.jsx";

function ProtectedRoute({ children }) {
  const auth = getAuth();
  return auth.currentUser ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const auth = getAuth();
  return auth.currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>

      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />


      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/personal" element={
        <ProtectedRoute><Personal /></ProtectedRoute>
      } />
      <Route path="/balance" element={
        <ProtectedRoute><Balance /></ProtectedRoute>
      } />


      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />

      <Route path="/video" element={
        <ProtectedRoute><VideoEdukasi /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;