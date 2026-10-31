import React from 'react';

export default function SocialProof() {
  const items = [
    {
      icon: (
        <span className="ic ic-star">
          <svg className="ico"><use href="#i-star" /></svg>
        </span>
      ),
      text: '4.8 / 5 Google-betyg'
    },
    {
      icon: (
        <span className="ic ic-cal">
          <svg className="ico"><use href="#i-cal" /></svg>
        </span>
      ),
      text: 'Erfarenhet sedan 1998'
    },
    {
      icon: (
        <span className="ic ic-pct">
          <svg className="ico"><use href="#i-pct" /></svg>
        </span>
      ),
      text: '50% RUT-avdrag direkt'
    },
    {
      icon: (
        <span className="ic ic-shield">
          <svg className="ico"><use href="#i-shield" /></svg>
        </span>
      ),
      text: 'Fullt ansvarsförsäkrade'
    }
  ];

  return (
    <div className="trust-strip" id="social-proof-strip">
      <div className="wrap">
        <div className="trust-items">
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="trust-item">
                {item.icon}
                <span>{item.text}</span>
              </div>
              {idx < items.length - 1 && <div className="trust-divider" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
