interface GardenServicesProps {
  onSelectService: (serviceName: string) => void;
}

interface ServiceItem {
  name: string;
  desc: string;
  img: string;
  alt: string;
}

const SERVICES: ServiceItem[] = [
  {
    name: 'Gräsklippning',
    desc: 'Vi håller din gräsmatta perfekt trimmad och välmående under hela säsongen.',
    img: '/images/garden/grasklippning.jpg',
    alt: 'Gräsklippning av gräsmatta'
  },
  {
    name: 'Beskärning',
    desc: 'Professionell beskärning av buskar och träd för optimal tillväxt och form.',
    img: '/images/garden/beskarning.jpg',
    alt: 'Beskärning av buskar och träd'
  },
  {
    name: 'Ogräsrensning',
    desc: 'Effektiv rensning av rabatter och gångar så att din trädgård ser välvårdad ut.',
    img: '/images/garden/ograsrensning.jpg',
    alt: 'Ogräsrensning i rabatter och gångar'
  },
  {
    name: 'Stenrengöring',
    desc: 'Högtryckstvätt av stenplattor och murar som tar bort mossa och smuts.',
    img: '/images/garden/stenrengoring.jpg',
    alt: 'Högtryckstvätt av stenplattor'
  },
  {
    name: 'Terrasstvätt',
    desc: 'Vi rengör din altan eller terrass så att den blir som ny inför sommarens grillkvällar.',
    img: '/images/garden/terrasstvatt.jpg',
    alt: 'Tvättad träaltan och terrass'
  },
  {
    name: 'Höst- & Vårstädning',
    desc: 'Vi hjälper dig att förbereda trädgården inför vintern eller väcka den till liv på våren.',
    img: '/images/garden/host-varstadning.jpg',
    alt: 'Säsongsstädning och räfsning i trädgård'
  }
];

export default function GardenServices({ onSelectService }: GardenServicesProps) {
  return (
    <section className="white" id="tjanster">
      <div className="wrap">
        <div className="hd">
          <h2>Våra tjänster inom trädgårdsservice</h2>
          <p>Vi erbjuder ett brett utbud av tjänster för att hålla din utemiljö i toppskick året om.</p>
        </div>

        <div className="svc">
          {SERVICES.map((s) => (
            <button
              key={s.name}
              type="button"
              className="s"
              data-service={s.name}
              onClick={() => onSelectService(s.name)}
              aria-label={`Välj ${s.name} och gå till formulär`}
            >
              <div className="ph">
                <img src={s.img} alt={s.alt} loading="lazy" />
                <span className="go-i">
                  <svg className="ico"><use href="#i-up-r" /></svg>
                </span>
              </div>
              <div className="tx">
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
