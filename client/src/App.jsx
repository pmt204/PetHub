import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './layouts/Layout';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import ServiceManagement from './components/Admin/ServiceManagement';
import NewsManagement from './components/Admin/NewsManagement';
import UserManagement from './components/Admin/UserManagement';
import CategoryServiceManagement from './components/Admin/CategoryServiceManagement';
import CustomerManagement from './components/Admin/CustomerManagement';
import BookingManagement from './components/Admin/BookingManagement';
import DoctorManagement from './components/Admin/DoctorManagement';
import CustomerDetail from './components/Admin/CustomerDetail';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import News from './pages/News/News';
import NewsDetail from './pages/News/NewsDetail';
import ActiveBookings from './pages/Bookings/MyBookings';
import PaymentResult from './pages/Bookings/PaymentResult';
import BookingHistory from './pages/Bookings/BookingHistory';
import BookingShipment from './pages/Bookings/BookingShipment';
import BookingResult from './pages/Bookings/BookingResult';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Account from './pages/Profiles/Account';
import MyPets from './pages/Profiles/MyPets';
import Services from './pages/Services/Services';
import ServiceHealthDetail from './pages/Services/ServiceHealthDetail';
import ServiceGroomDetail from './pages/Services/ServiceGroomDetail';
import ServiceHotelDetail from './pages/Services/ServiceHotelDetail';
import ServiceShipmentDetail from './pages/Services/ServiceShipmentDetail';
import DoctorDetail from './pages/Doctors/DoctorDetail';
import Doctor from './pages/Doctors/DoctorPage';
import PetProfile from './pages/Profiles/PetProfile';

const CategoryServiceDetail = () => {
  const { id } = useParams(); 
  const categoryId = parseInt(id, 10);

  switch (categoryId) {
    case 1:
      return <ServiceHealthDetail />;
    case 2:
      return <ServiceGroomDetail />;
    case 3:
      return <ServiceHotelDetail />;
    case 4:
      return <ServiceShipmentDetail />;
    default:
      return <Navigate to="/services" replace />; 
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthenticatedRedirect = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="booking-result" element={<BookingResult />} />
        <Route path="payment-result" element={<PaymentResult />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="categoryservices/:id" element={<CategoryServiceDetail />} /> 
          <Route path="news" element={<News />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="account" element={<Account />} />
          <Route path="mypets" element={<MyPets />} />
          <Route path="/pet-profile/:petId" element={<PetProfile />} />
          <Route path="doctors" element={<Doctor />} />
          <Route path="doctors/:id" element={<DoctorDetail />} />
          <Route path="shipment" element={<BookingShipment />} />
          <Route
            path="mybookings"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <ActiveBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookinghistory"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="categoryservice" element={<CategoryServiceManagement />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="news" element={<NewsManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="doctors" element={<DoctorManagement />} />
        </Route>

        <Route
          path="/login"
          element={
            <AuthenticatedRedirect>
              <Login />
            </AuthenticatedRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <AuthenticatedRedirect>
              <Register />
            </AuthenticatedRedirect>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;