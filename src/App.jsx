import { Routes, Route, Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Register from "./pages/Register";

function ProtectedRoute({ children }) {
  const auth = getAuth();
  return auth.currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="register" element={<Register />}></Route>
    </Routes>
  );
}

export default App;