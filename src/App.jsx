import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/Home/HomePage';
import RegisterObjectPage from './pages/RegisterObject/RegisterObjectPage';
import ObjectsPage from './pages/Objects/ObjectsPage';
import ObjectDetailsPage from './pages/ObjectDetails/ObjectDetailsPage';
import { ROUTES } from './utils/constants';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.objects} element={<ObjectsPage />} />
        <Route path={ROUTES.registerObject} element={<RegisterObjectPage />} />
        <Route path={ROUTES.objectDetails} element={<ObjectDetailsPage />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
