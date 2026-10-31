interface ReviewItem {
  initials: string;
  bg: string;
  name: string;
  meta: string;
  date: string;
  text: string;
  tag: string;
}

const REVIEWS: ReviewItem[] = [
  {
    initials: 'VD',
    bg: '#E94B46',
    name: 'Vann Dao',
    meta: 'Verifierad kund',
    date: '2024-04-05',
    text: '“Fantastiskt bra jobb. Rekommenderas verkligen. Bra kvalitet & service!”',
    tag: 'Trädgårdsservice'
  },
  {
    initials: 'AM',
    bg: '#1f6fb2',
    name: 'Arjan Mostafa',
    meta: 'Local Guide · Verifierad recension',
    date: '2022-12-29',
    text: '“Väldigt nöjd! Ställde upp med kort varsel och gjorde ett kanonjobb till rimlig peng. Femstjärnigt!”',
    tag: 'Utemiljö & Fastighetsservice'
  },
  {
    initials: 'ES',
    bg: '#16a34a',
    name: 'Emilia Schellhas',
    meta: 'Verifierad kund',
    date: '2023-11-07',
    text: '“Bra kvalitet & service! Personalen var trevliga och tog hand om allt precis som utlovat.”',
    tag: 'Trädgårdsskötsel'
  },
  {
    initials: 'PM',
    bg: '#7c3aed',
    name: 'Pedro Maldaner',
    meta: 'Verifierad recension',
    date: '2023-01-02',
    text: '“Very friendly and professional personal, I strongly recommend their services.”',
    tag: 'Trädgård & Skötsel'
  }
];

export default function Testimonials() {
  return (
    <section className="alt" id="recensioner">
      <div className="wrap">
        <div className="hd">
          <h2>Vad våra kunder säger</h2>
          <p>Omdömen från verifierade kunder och Google-recensioner.</p>
        </div>

        <div className="score">
          <span className="n">4.8</span>
          <div>
            <div className="stars">
              <svg className="ico"><use href="#i-star" /></svg>
              <svg className="ico"><use href="#i-star" /></svg>
              <svg className="ico"><use href="#i-star" /></svg>
              <svg className="ico"><use href="#i-star" /></svg>
              <svg className="ico"><use href="#i-star" /></svg>
            </div>
            <small>Baserat på verifierade omdömen</small>
            <small className="g-l">
              <svg width="14" height="14"><use href="#i-google" /></svg>
              <span>Verifierade Google-omdömen</span>
            </small>
          </div>
        </div>

        <div className="rv">
          {REVIEWS.map((r, i) => (
            <article key={i} className="r">
              <div className="who">
                <div className="av" style={{ background: r.bg }}>
                  {r.initials}
                </div>
                <div>
                  <b>{r.name}</b>
                  <small>{r.meta}</small>
                </div>
              </div>

              <div className="st5">
                <span className="stars">
                  <svg className="ico"><use href="#i-star" /></svg>
                  <svg className="ico"><use href="#i-star" /></svg>
                  <svg className="ico"><use href="#i-star" /></svg>
                  <svg className="ico"><use href="#i-star" /></svg>
                  <svg className="ico"><use href="#i-star" /></svg>
                </span>
                <span>{r.date}</span>
              </div>

              <q>{r.text}</q>

              <div className="ft">
                <span className="tag">{r.tag}</span>
                <span className="gv">
                  <svg width="15" height="15"><use href="#i-google" /></svg>
                  <span>Verifierat omdöme</span>
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="gmaps">
          <a
            href="https://www.google.com/maps/search/?api=1&query=St%C3%A4d+%26+Tr%C3%A4dg%C3%A5rdsservice+Gnosj%C3%B6"
            target="_blank"
            rel="noopener noreferrer"
            id="view-google-reviews-btn"
          >
            <svg width="20" height="20"><use href="#i-google" /></svg>
            <span>Se alla omdömen på Google Maps</span>
          </a>
        </div>
      </div>
    </section>
  );
}
