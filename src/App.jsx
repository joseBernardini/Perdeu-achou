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
import { ROUTES } from './utils/constants';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
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
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
