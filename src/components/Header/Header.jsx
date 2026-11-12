import BrandLogo from '../BrandLogo/BrandLogo';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <BrandLogo />
      </div>
    </header>
  );
}

export default Header;
