interface WhatsIncludedProps {
  onScrollToForm: () => void;
}

export default function WhatsIncluded({ onScrollToForm }: WhatsIncludedProps) {
  return (
    <section className="white" style={{ padding: '0 0 60px' }} id="garanti">
      <div className="wrap">
        <div className="band" style={{ margin: '0 auto' }}>
          <div className="ic">
            <svg className="ico"><use href="#i-shield" /></svg>
          </div>
          <div>
            <h3>Trygg personal &amp; 100% nöjdhetsgaranti</h3>
            <p>
              All vår personal är fullt försäkrad och arbetar under kollektivavtal. Vi tar hand om din utemiljö med samma omsorg som vår egen.
            </p>
          </div>
          <a
            className="btn btn-red btn-sm"
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
        </div>
      </div>
    </section>
  );
}
