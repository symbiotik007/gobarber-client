import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Landing from '../pages/Landing';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Dashboard from '../pages/Dashboard';
import Booking from '../pages/Booking';
import BookingStepper from '../pages/BookingStepper';
import BookingStatusPage from '../pages/BookingStatusPage';
import ReschedulePage from '../pages/ReschedulePage';

function PrivateRoute({ children }) {
  const { signed } = useAuth();
  return signed ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { signed } = useAuth();
  return !signed ? children : <Navigate to="/dashboard" replace />;
}

function LoginPage() {
  const { signed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (signed) {
      const redirect = sessionStorage.getItem('@gobarber:redirect') || '/dashboard';
      sessionStorage.removeItem('@gobarber:redirect');
      navigate(redirect, { replace: true });
    }
  }, [signed, navigate]);

  return <SignIn />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/book" element={<BookingStepper />} />
      <Route path="/booking/status/:reference" element={<BookingStatusPage />} />
      <Route path="/reschedule/:token" element={<ReschedulePage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/booking/:providerId" element={<PrivateRoute><Booking /></PrivateRoute>} />
    </Routes>
  );
}
