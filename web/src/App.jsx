// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import NavBar from "./components/NavBar";
import LandingNavBar from "./components/LandingNavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TutorProfile from "./pages/TutorProfile";
import StudentProfile from "./pages/StudentProfile";
import HelpRequest from "./pages/HelpRequest";
import BrowseTutors from "./pages/BrowseTutors";
import ProtectedRoute from "./components/ProtectedRoute";
import TutorRequests from "./pages/TutorRequests";
import StudentRequests from "./pages/StudentRequests";
import TutorDetail from "./pages/TutorDetail";

export default function App() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const isLandingPage = pathname === "/" && !loading && !user;

  return (
    <>
      {isLandingPage ? <LandingNavBar /> : <NavBar />}
      <div style={{ maxWidth: pathname === "/" && !user ? "100%" : 900, margin: "0 auto", padding: pathname === "/" && !user ? 0 : 16 }}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<BrowseTutors />} />
        <Route path="/tutors/:tutor_id" element={<TutorDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Tutor routes */}
        <Route
          path="/tutor/profile"
          element={
            <ProtectedRoute needRole="tutor">
              <TutorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/requests"
          element={
            <ProtectedRoute needRole="tutor">
              <TutorRequests />
            </ProtectedRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute needRole="student">
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/request"
          element={
            <ProtectedRoute needRole="student">
              <HelpRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/requests"
          element={
            <ProtectedRoute needRole="student">
              <StudentRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
    </>
  );
}
