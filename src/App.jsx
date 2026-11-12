import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/Home/HomePage';
import { ROUTES } from './utils/constants';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
