import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/Home/HomePage';
import RegisterObjectPage from './pages/RegisterObject/RegisterObjectPage';
import ObjectsPage from './pages/Objects/ObjectsPage';
import ObjectDetailsPage from './pages/ObjectDetails/ObjectDetailsPage';
import RecoveryRequestPage from './pages/RecoveryRequest/RecoveryRequestPage';
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import PasswordResetPage from './pages/Auth/PasswordResetPage';
import UserAreaPage from './pages/UserArea/UserAreaPage';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminOverviewPage from './pages/Admin/AdminOverviewPage';
import AdminObjectsPage from './pages/Admin/AdminObjectsPage';
import AdminObjectDetailsPage from './pages/Admin/AdminObjectDetailsPage';
import AdminRequestsPage from './pages/Admin/AdminRequestsPage';
import AdminRequestDetailsPage from './pages/Admin/AdminRequestDetailsPage';
import AdminHistoryPage from './pages/Admin/AdminHistoryPage';
import AdminRolesPage from './pages/Admin/AdminRolesPage';
import { ROUTES } from './utils/constants';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path={ROUTES.admin} element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path={ROUTES.adminObjects} element={<AdminObjectsPage />} />
          <Route path={ROUTES.adminObjectDetails} element={<AdminObjectDetailsPage />} />
          <Route path={ROUTES.adminRequests} element={<AdminRequestsPage />} />
          <Route path={ROUTES.adminRequestDetails} element={<AdminRequestDetailsPage />} />
          <Route path={ROUTES.adminHistory} element={<AdminHistoryPage />} />
          <Route path={ROUTES.adminRoles} element={<AdminRolesPage />} />
          <Route path="*" element={<Navigate to={ROUTES.admin} replace />} />
        </Route>

        <Route element={<Layout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.objects} element={<ObjectsPage />} />
          <Route path={ROUTES.registerObject} element={<RegisterObjectPage />} />
          <Route path={ROUTES.objectDetails} element={<ObjectDetailsPage />} />
          <Route path={ROUTES.recoveryRequest} element={<RecoveryRequestPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.signUp} element={<SignUpPage />} />
          <Route path={ROUTES.passwordReset} element={<PasswordResetPage />} />
          <Route path={ROUTES.userArea} element={<UserAreaPage />} />
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
