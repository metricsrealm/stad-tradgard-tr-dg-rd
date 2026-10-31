export default function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <a className="logo" href="#" aria-label="Städ & Trädgårdsservice – Sedan 1998">
          <img
            src="https://stadochtradgard.se/wp-content/uploads/2023/02/IMG_2579-e1715026825546-2048x431.png"
            alt="Städ & Trädgårdsservice – Sedan 1998"
            width="366"
            height="74"
            id="header-logo"
            referrerPolicy="no-referrer"
          />
        </a>
        <a className="call" href="tel:+46101753040" id="header-phone-btn">
          <svg className="ico"><use href="#i-phone" /></svg>
          <span>010-175 30 40</span>
        </a>
      </div>
    </header>
  );
}
