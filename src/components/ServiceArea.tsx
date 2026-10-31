interface ServiceAreaProps {
  currentCityName?: string;
}

const CITIES = [
  'Gnosjö',
  'Värnamo',
  'Gislaved',
  'Anderstorp',
  'Hillerstorp',
  'Hestra',
  'Kulltorp',
  'Forsheda',
  'Jönköping',
  'Borås',
  'Göteborg'
];

export default function ServiceArea({ currentCityName }: ServiceAreaProps) {
  return (
    <section className="white region" id="omrade">
      <div className="wrap">
        <div className="pin">
          <svg className="ico"><use href="#i-pin" /></svg>
        </div>

        <div className="hd" style={{ marginBottom: '34px' }}>
          <h2>
            {currentCityName ? (
              <>
                Vi utför trädgårdsservice i <span data-city>{currentCityName}</span> &amp; din region
              </>
            ) : (
              'Vi utför trädgårdsservice i din region'
            )}
          </h2>
          <p>
            Vi hjälper privatpersoner, bostadsrättsföreningar och företag i Gnosjö, Värnamo, Gislaved, Anderstorp, Jönköping, Borås, Göteborg och omkringliggande områden.
          </p>
        </div>

        <div className="pills">
          {CITIES.map((city) => {
            const isMatch = currentCityName && city.toLowerCase().includes(currentCityName.toLowerCase());
            return (
              <span
                key={city}
                style={isMatch ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 } : undefined}
              >
                {city}
              </span>
            );
          })}
        </div>

        <div className="ask">
          <h3>Tveksam om vi är verksamma på din gata?</h3>
          <a href="tel:+46101753040">
            <svg className="ico"><use href="#i-phone" /></svg>
            <span>Ring och fråga oss direkt: <span className="nowrap">010-175 30 40</span></span>
          </a>
        </div>
      </div>
    </section>
  );
}
