import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
