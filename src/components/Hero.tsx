import GardenEnquiryForm from './GardenEnquiryForm';

interface HeroProps {
  currentCityName: string;
  selectedService?: string;
  onScrollToForm: () => void;
  onPrivacyClick: () => void;
  onSubmitSuccess?: (services: string[], city: string) => void;
}

export default function Hero({
  currentCityName,
  selectedService,
  onScrollToForm,
  onPrivacyClick,
  onSubmitSuccess
}: HeroProps) {
  return (
    <section className="hero" id="hero-section">
      <div className="wrap">
        <div className="hero-copy">
          <span className="pill">
            <svg className="ico"><use href="#i-star" /></svg>
            <span>4.8/5 Google-betyg</span>
          </span>

          <h1 id="hero-heading" className="hero-title-2lines">
            <span className="hero-l1">
              {currentCityName ? (
                <>Professionell trädgårdsservice i <span data-city>{currentCityName}</span></>
              ) : (
                'Professionell trädgårdsservice'
              )}
            </span>
            <span className="hero-l2">för en välskött trädgård</span>
          </h1>

          <div className="chips">
            <div className="chip">
              <svg className="ico"><use href="#i-checkc" /></svg>
              <span>50% RUT-avdrag direkt</span>
            </div>
            <div className="chip">
              <svg className="ico"><use href="#i-checkc" /></svg>
              <span>Sedan 1998 · 25+ års erfarenhet</span>
            </div>
            <div className="chip">
              <svg className="ico"><use href="#i-checkc" /></svg>
              <span>Fullt försäkrade &amp; kollektivavtal</span>
            </div>
            <div className="chip">
              <svg className="ico"><use href="#i-checkc" /></svg>
              <span>Egen modern maskinpark</span>
            </div>
          </div>

          <div className="hero-cta">
            <a
              className="btn btn-red"
              href="#offert"
              onClick={(e) => {
                e.preventDefault();
                onScrollToForm();
              }}
              data-goto="form"
              id="hero-primary-cta"
            >
              <span>Få hjälp med trädgården</span>
              <svg className="ico"><use href="#i-arrow" /></svg>
            </a>
            <a
              className="btn btn-ghost"
              href="tel:+46101753040"
              id="hero-secondary-cta"
            >
              <svg className="ico"><use href="#i-phone" /></svg>
              <span>010-175 30 40</span>
            </a>
          </div>
        </div>

        {/* The Lead Form Card */}
        <GardenEnquiryForm
          initialService={selectedService}
          initialCity={currentCityName}
          onPrivacyClick={onPrivacyClick}
          onSubmitSuccess={onSubmitSuccess}
        />
      </div>
    </section>
  );
}
