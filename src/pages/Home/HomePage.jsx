import HeroSection from './sections/HeroSection';
import PresentationSection from './sections/PresentationSection';
import CategoriesSection from './sections/CategoriesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import TrustSection from './sections/TrustSection';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home">
      <HeroSection />
      <PresentationSection />
      <CategoriesSection />
      <HowItWorksSection />
      <TrustSection />
    </div>
  );
}

export default HomePage;
