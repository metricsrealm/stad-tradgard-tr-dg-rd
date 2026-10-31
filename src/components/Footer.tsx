interface FooterProps {
  onPrivacyClick?: () => void;
}

export default function Footer({ onPrivacyClick }: FooterProps) {
  return (
    <footer id="footer-landing">
      <div className="wrap">
        <div className="cols">
          <div>
            <h4>Städ &amp; Trädgårdsservice AB</h4>
            <p>
              Professionell trädgårdsservice och fastighetsskötsel sedan 1998. Vi levererar förstklassig omsorg för din trädgård och utemiljö med full ansvarsförsäkring och 100% nöjd-kund-garanti.
            </p>
            <div className="mono">Godkänd för F-skatt · Kollektivavtal · Fullt ansvarsförsäkrade</div>
          </div>
          <div>
            <h5>Kontaktuppgifter</h5>
            <div className="ct">
              <span>Telefon:</span> <a href="tel:+46101753040">010-175 30 40</a>
            </div>
            <div className="ct">
              <span>E-post:</span> <a href="mailto:info@stadochtradgard.se">info@stadochtradgard.se</a>
            </div>
            <div className="areas">
              Verksamma i Gnosjö, Värnamo, Gislaved, Anderstorp, Hillerstorp, Jönköping, Borås, Göteborg och omnejd.
            </div>
          </div>
        </div>
        <div className="bot">
          <span>&copy; {new Date().getFullYear()} Städ &amp; Trädgårdsservice AB. Alla rättigheter reserverade.</span>
          <button
            type="button"
            onClick={onPrivacyClick}
            className="cursor-pointer bg-transparent border-none text-inherit underline"
          >
            Integritetspolicy (GDPR)
          </button>
        </div>
      </div>
    </footer>
  );
}
