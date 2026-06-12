import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewEnquiry from './pages/NewEnquiry';
import EnquiryList from './pages/EnquiryList';
import FollowUps from './pages/FollowUps';
import Admissions from './pages/Admissions';
import AdmissionReceipt from './pages/AdmissionReceipt';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="new-enquiry" element={<NewEnquiry />} />
              <Route path="enquiries" element={<EnquiryList />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="reports" element={<Reports />} />
              
              {/* Admin Only Routes */}
              <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
                <Route path="admissions" element={<Admissions />} />
                <Route path="receipt/:id" element={<AdmissionReceipt />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
