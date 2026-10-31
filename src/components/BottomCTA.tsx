interface BottomCTAProps {
  onScrollToForm: () => void;
}

export default function BottomCTA({ onScrollToForm }: BottomCTAProps) {
  return (
    <div className="final" id="bottom-cta-banner">
      <div className="wrap">
        <h2>Redo för en välskött trädgård?</h2>
        <p>
          Berätta vad du behöver hjälp med så kontaktar vi dig inom 24 timmar för kostnadsfri offert med 50% RUT-avdrag direkt.
        </p>

        <div className="hero-cta">
          <a
            className="btn btn-red"
            href="#offert"
            onClick={(e) => {
              e.preventDefault();
              onScrollToForm();
            }}
            data-goto="form"
          >
            <span>Få hjälp med din trädgård</span>
            <svg className="ico"><use href="#i-arrow" /></svg>
          </a>

          <a className="btn btn-ghost" href="tel:+46101753040">
            <svg className="ico"><use href="#i-phone" /></svg>
            <span>Ring: 010-175 30 40</span>
          </a>
        </div>

        <div className="ticks">
          <span>
            <svg className="ico"><use href="#i-check" /></svg>50% RUT-avdrag direkt
          </span>
          <span>
            <svg className="ico"><use href="#i-check" /></svg>100% Nöjdhetsgaranti
          </span>
          <span>
            <svg className="ico"><use href="#i-check" /></svg>Sedan 1998
          </span>
          <span>
            <svg className="ico"><use href="#i-check" /></svg>Kostnadsfri offert
          </span>
        </div>

        <div className="labels">
          <span>Nöjdhetsgaranti</span>
          <span>·</span>
          <span>Erfarna sedan 1998</span>
          <span>·</span>
          <span>50% RUT-avdrag</span>
        </div>
      </div>
    </div>
  );
}
