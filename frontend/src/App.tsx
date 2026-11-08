import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WebSocketProvider } from './context/WebSocketContext';

// Layouts
import CodingLayout from './layouts/CodingLayout';
import LearningLayout from './layouts/LearningLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import RoleRoute from './components/RoleRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/profile/Profile';
import LearningWorkspace from './pages/learning/LearningWorkspace';
import PracticeCatalog from './pages/oj/PracticeCatalog';
import ProblemWorkspace from './pages/oj/ProblemWorkspace';
import ContestList from './pages/contest/ContestList';
import ContestWorkspace from './pages/contest/ContestWorkspace';
import ContestLeaderboard from './pages/contest/ContestLeaderboard';
import CartPage from './pages/cart/CartPage';
import SuccessPage from './pages/payment/SuccessPage';
import CancelPage from './pages/payment/CancelPage';
import DepositPage from './pages/payment/DepositPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import './pages/admin/AdminUI.css';
import CourseCreator from './pages/admin/CourseCreator';
import QuizManager from './pages/admin/QuizManager';
import TestcaseGenerator from './pages/admin/TestcaseGenerator';
import CourseCatalog from './pages/courses/CourseCatalog';
import CourseDetail from './pages/courses/CourseDetail';
import MyLearning from './pages/courses/MyLearning';

import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{
        style: { background: '#1b1c21', color: '#f7f7fa', border: '1px solid #414149', borderRadius: 3, fontFamily: '"IBM Plex Mono", monospace', fontSize: 12 },
      }} />
      <AuthProvider>
        <CartProvider>
          <WebSocketProvider>
            <Routes>
              {/* Main Layout Routes */}
              <Route element={<CodingLayout />}>
                <Route index element={<Home />} />
                {/* Public Routes */}
                <Route path="courses" element={<CourseCatalog />} />
                <Route path="courses/:courseId" element={<CourseDetail />} />
                <Route path="oj/practice" element={<PracticeCatalog />} />
                <Route path="contests" element={<ContestList />} />

                {/* Guest-only Routes */}
                <Route
                  path="login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />
                <Route
                  path="register"
                  element={
                    <GuestRoute>
                      <Register />
                    </GuestRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="dashboard"
                  element={<Navigate to="/oj/practice" replace />}
                />
                <Route
                  path="my-learning"
                  element={
                    <ProtectedRoute>
                      <MyLearning />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="cart"
                  element={
                    <ProtectedRoute>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="oj/problems/:problemId"
                  element={
                    <ProtectedRoute>
                      <ProblemWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="contests/:contestId"
                  element={
                    <ProtectedRoute>
                      <ContestWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="contests/:contestId/leaderboard"
                  element={
                    <ProtectedRoute>
                      <ContestLeaderboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="payment/success"
                  element={
                    <ProtectedRoute>
                      <SuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="payment/cancel"
                  element={
                    <ProtectedRoute>
                      <CancelPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="deposit"
                  element={
                    <ProtectedRoute>
                      <DepositPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin/Teacher Routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'TEACHER']}>
                      <div className="admin-ui"><AdminDashboard /></div>
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/courses/new"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'TEACHER']}>
                      <div className="admin-ui"><CourseCreator /></div>
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/quizzes/:lessonId"
                  element={
                    <RoleRoute allowedRoles={['ADMIN', 'TEACHER']}>
                      <div className="admin-ui"><QuizManager /></div>
                    </RoleRoute>
                  }
                />
                <Route
                  path="admin/problems/:problemId/testcases"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <div className="admin-ui"><TestcaseGenerator /></div>
                    </RoleRoute>
                  }
                />
              </Route>

              {/* Learning Workspace (No Main Navbar Layout) */}
              <Route
                path="learning/:courseId/lessons/:lessonId"
                element={
                  <ProtectedRoute>
                    <LearningLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<LearningWorkspace />} />
              </Route>

              {/* Fallback Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WebSocketProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
