import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Vad ingår i er trädgårdsservice',
    answer: 'Vår trädgårdsservice inkluderar gräsklippning, beskärning, ogräsrensning, terrasstvätt och höst/vårstädning. Vi skräddarsyr tjänsten efter dina behov.'
  },
  {
    question: 'Hur ofta behöver jag boka trädgårdsservice?',
    answer: 'Det beror på din trädgårds storlek och behov. De flesta kunder bokar varannan vecka under sommarsäsongen och mer sällan under höst och vinter.'
  },
  {
    question: 'Erbjuder ni trädgårdsservice för företag?',
    answer: 'Ja, vi erbjuder trädgårdsservice för både privatpersoner och företag med omnejd. Kontakta oss för en skräddarsydd offert.'
  },
  {
    question: 'Hur bokar jag trädgårdsservice?',
    answer: 'Du bokar enkelt via formuläret på sidan eller ringer oss direkt på 010-175 30 40. Vi återkommer inom 24 timmar med ett prisförslag.'
  },
  {
    question: 'Vilket område täcker ni med trädgårdsservice?',
    answer: 'Vi utför trädgårdsservice och närliggande områden som Gislaved och Värnamo. Kontakta oss om du är osäker på om vi täcker ditt område.'
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="alt" id="faq-section">
      <div className="wrap">
        <div className="hd">
          <h2>Vanliga frågor om trädgårdsservice</h2>
          <p>Här hittar du svar på de vanligaste frågorna inför din bokning eller förfrågan.</p>
        </div>

        <div className="faq" id="faq">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className={`q ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(idx)}
                >
                  <span>{faq.question}</span>
                  <span className="chev">
                    <svg className="ico"><use href="#i-down" /></svg>
                  </span>
                </button>
                <div className="a">
                  <div>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
