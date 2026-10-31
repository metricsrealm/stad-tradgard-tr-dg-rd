import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import GardenServices from './components/GardenServices';
import WhatsIncluded from './components/WhatsIncluded';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import ServiceArea from './components/ServiceArea';
import FAQ from './components/FAQ';
import BottomCTA from './components/BottomCTA';
import Footer from './components/Footer';
import Tack from './components/Tack';
import PrivacyModal from './components/PrivacyModal';

const getInitialCity = () => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const paramCity = params.get('city');
  if (paramCity) {
    const decoded = decodeURIComponent(paramCity);
    return decoded ? decoded.charAt(0).toUpperCase() + decoded.slice(1) : '';
  }
  return '';
};

const getInitialService = () => {
  if (typeof window === 'undefined') return 'Gräsklippning';
  const params = new URLSearchParams(window.location.search);
  const s = params.get('service');
  if (s) {
    const dec = decodeURIComponent(s).toLowerCase();
    if (dec.includes('gräs') || dec.includes('klipp')) return 'Gräsklippning';
    if (dec.includes('beskär')) return 'Beskärning';
    if (dec.includes('ogräs')) return 'Ogräsrensning';
    if (dec.includes('sten')) return 'Stenrengöring';
    if (dec.includes('terrass') || dec.includes('altan')) return 'Terrasstvätt';
    if (dec.includes('höst') || dec.includes('vår') || dec.includes('säsong')) return 'Höst- & Vårstädning';
  }
  return 'Gräsklippning';
};

export default function App() {
  const [activeCity, setActiveCity] = useState<string>(getInitialCity());
  const [selectedService, setSelectedService] = useState<string>(getInitialService());
  const [isTackPage, setIsTackPage] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // Global listener for phone clicks to trigger dataLayer event 'phone_click'
  useEffect(() => {
    const handlePhoneClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (target && target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href && href.startsWith('tel:')) {
          try {
            const cleanPhone = href.replace('tel:', '').trim();
            const clickText = target.textContent?.trim() || '';
            const dataLayer = (window as any).dataLayer || [];
            
            dataLayer.push({
              event: 'phone_click',
              phone_number: cleanPhone,
              click_text: clickText
            });
          } catch (err) {
            console.error('Error pushing phone_click event to dataLayer:', err);
          }
        }
      }
    };

    document.addEventListener('click', handlePhoneClick);
    return () => document.removeEventListener('click', handlePhoneClick);
  }, []);

  // Sync URL routes on load
  useEffect(() => {
    const parseUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      const paramCity = params.get('city');
      let city = '';
      if (paramCity) {
        const decoded = decodeURIComponent(paramCity);
        city = decoded ? decoded.charAt(0).toUpperCase() + decoded.slice(1) : '';
      }

      if (path.includes('tack') || params.get('page') === 'tack') {
        setIsTackPage(true);
      } else {
        setIsTackPage(false);
      }

      if (city) setActiveCity(city);
    };

    parseUrlRoute();
    window.addEventListener('popstate', parseUrlRoute);
    return () => window.removeEventListener('popstate', parseUrlRoute);
  }, []);

  // Post-render DOM override for dynamic city titles
  useEffect(() => {
    document.querySelectorAll('[data-city]').forEach((el) => {
      el.textContent = activeCity || '';
    });
    document.title = activeCity
      ? `Professionell trädgårdsservice i ${activeCity} | Städ & Trädgårdsservice`
      : `Trädgårdsservice med 50% RUT-avdrag | Städ & Trädgårdsservice`;
  }, [activeCity]);

  // Smooth scroll to hero form helper matching index_96d4784e.html
  const scrollToForm = () => {
    const card = document.getElementById('offert');
    if (card) {
      const top = card.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 1180 ? 16 : 40);
      window.scrollTo({ top, behavior: 'smooth' });

      // Focus first input or checkbox if available
      setTimeout(() => {
        const input = card.querySelector('input') as HTMLElement | null;
        if (input) input.focus({ preventScroll: true });
      }, 400);
    }
  };

  // When a service card is clicked
  const handleSelectService = (serviceName: string) => {
    setSelectedService(serviceName);
    scrollToForm();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-[#161e2e]">
      {/* 1. Header with Logo and Phone */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {isTackPage ? (
          <Tack
            serviceType={selectedService}
            cityName={activeCity}
            onGoBack={() => setIsTackPage(false)}
          />
        ) : (
          <>
            {/* 2. Hero Section with Headline, Benefits, and Lead Form */}
            <Hero
              currentCityName={activeCity}
              selectedService={selectedService}
              onScrollToForm={scrollToForm}
              onPrivacyClick={() => setIsPrivacyOpen(true)}
            />

            {/* 3. Horizontal Trust Bar */}
            <SocialProof />

            {/* 4. Services Grid with 6 Cards */}
            <GardenServices onSelectService={handleSelectService} />

            {/* 5. Gallery Accordion & Guarantee Band */}
            <WhatsIncluded onScrollToForm={scrollToForm} />

            {/* 6. Why Choose Us (4 Cards) */}
            <WhyChooseUs />

            {/* 7. Verified Reviews and Google Rating */}
            <Testimonials />

            {/* 8. Regional Coverage */}
            <ServiceArea currentCityName={activeCity} />

            {/* 9. FAQ Accordion (6 Questions) */}
            <FAQ />

            {/* 10. Final CTA Banner */}
            <BottomCTA onScrollToForm={scrollToForm} />
          </>
        )}
      </main>

      {/* 11. Footer */}
      <Footer onPrivacyClick={() => setIsPrivacyOpen(true)} />

      {/* GDPR Privacy Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
