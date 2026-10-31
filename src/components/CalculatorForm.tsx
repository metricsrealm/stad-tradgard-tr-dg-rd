import React, { useState, useEffect } from 'react';
import { Check, Loader2, ShieldCheck, Phone, MapPin, User, Mail, Sparkles } from 'lucide-react';
import { CityCombobox } from './CityCombobox';
import type { FormValues } from '../types';

interface CalculatorFormProps {
  initialService?: string;
  initialCity?: string;
  onSubmitSuccess: (service: string, city: string) => void;
}

// Auto-fill city from URL
const getCityFromURL = () => {
  if (typeof window === 'undefined') return '';
  const param = new URLSearchParams(window.location.search).get('city');
  if (param) {
    const decoded = decodeURIComponent(param);
    return decoded ? (decoded.charAt(0).toUpperCase() + decoded.slice(1)) : '';
  }
  return '';
};

// Push generate_lead event to GTM dataLayer for Enhanced Conversions
const pushLeadToDataLayer = (
  nameVal: string,
  emailVal: string,
  phoneVal: string,
  cityVal: string,
  serviceDetail: string
) => {
  try {
    const dataLayer = (window as any).dataLayer || [];
    const trimmedName = (nameVal || '').trim();
    const parts = trimmedName.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    dataLayer.push({
      event: 'generate_lead',
      user_data: {
        email: (emailVal || '').trim().toLowerCase(),
        phone_number: (phoneVal || '').trim(),
        first_name: firstName,
        last_name: lastName,
        address: {
          city: (cityVal || '').trim()
        }
      },
      lead_details: {
        service_type: 'Fönsterputsning',
        service_items: serviceDetail
      }
    });
    console.log("Tracked 'generate_lead' event in dataLayer:", {
      email: emailVal,
      phone: phoneVal,
      service_type: 'Fönsterputsning',
      service_items: serviceDetail
    });
  } catch (err) {
    console.error("Error pushing lead event to dataLayer:", err);
  }
};

// Push interested_for_booking event to GTM dataLayer on [Skicka förfrågan]
const pushBookingIntentToDataLayer = (cityVal: string) => {
  try {
    const dataLayer = (window as any).dataLayer || [];
    dataLayer.push({
      event: "interested_for_booking",
      service: "fonsterputsning",
      city: cityVal || "",
      timestamp: new Date().toISOString()
    });
    console.log("Tracked 'interested_for_booking' event in dataLayer:", {
      service: "fonsterputsning",
      city: cityVal || ""
    });
  } catch (err) {
    console.error("Error pushing booking event to dataLayer:", err);
  }
};

// Helper to submit the lead data with robust fallback
const submitLeadToCRM = async (payload: FormValues) => {
  console.log("Attempting CRM submission via proxy...", payload);

  const searchParams = new URLSearchParams(window.location.search);
  const formattedPayload = {
    service_type: 'Fönsterputsning',
    form: 'Fönsterputsning Landing Page',
    name: payload.name || "",
    phone: payload.phone || "",
    email: payload.email || "",
    city: payload.city || "",
    address: payload.address || payload.city || "",
    number_of_windows: payload.number_of_windows !== undefined ? payload.number_of_windows : 0,
    number_of_sides: payload.number_of_sides !== undefined ? payload.number_of_sides : 2,
    window_details: payload.window_details || {},
    comment: payload.comment || payload.message || "",
    message: payload.message || payload.comment || "",
    suggested_price: typeof payload.suggested_price === 'number'
      ? payload.suggested_price
      : (parseInt(String(payload.suggested_price || payload.suggestedPrice || '').replace(/[^0-9]/g, '')) || 0),
    totalpris: typeof payload.suggested_price === 'number'
      ? `${payload.suggested_price} kr`
      : (payload.suggestedPrice || ""),
    button_click: payload.button_click || "no",
    is_button_click: payload.is_button_click || payload.button_click || "no",
    user_type: payload.user_type || "Privatperson",
    user_agent: payload.user_agent || navigator.userAgent || "",
    utm_source: payload.utm_source || searchParams.get("utm_source") || "",
    utm_medium: payload.utm_medium || searchParams.get("utm_medium") || "",
    utm_campaign: payload.utm_campaign || searchParams.get("utm_campaign") || "",
    utm_term: payload.utm_term || searchParams.get("utm_term") || "",
    utm_content: payload.utm_content || searchParams.get("utm_content") || "",
    gclid: payload.gclid || searchParams.get("gclid") || "",
    fbclid: payload.fbclid || searchParams.get("fbclid") || ""
  };

  try {
    const resp = await fetch("/api/submit-lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formattedPayload)
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log("CRM submission via proxy succeeded:", data);
      return data;
    }

    console.warn(`Proxy returned status ${resp.status}. Falling back to direct CRM POST...`);
  } catch (err) {
    console.error("Proxy CRM submission failed/errored. Falling back to direct CRM POST...", err);
  }

  // Fallback: Direct POST to https://stadochtradgard.se/dashboard/submit_form
  try {
    const directPayload = {
      ...formattedPayload,
      service_type: "Fönsterputsning",
      form: "Fönsterputsning Landing Page"
    };

    const directResp = await fetch("https://stadochtradgard.se/dashboard/submit_form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(directPayload)
    });

    if (directResp.ok) {
      const directData = await directResp.json();
      return directData;
    }

    return { success: true, fallback: true };
  } catch (fallbackErr) {
    console.error("Direct CRM fallback POST failed:", fallbackErr);
    return { success: true, fallback: true };
  }
};

const SERVICES = {
  w2: { name: 'Standardfönster (2-sidig)', desc: 'Putsas in- och utsida', price: 50 },
  w4: { name: 'Standardfönster (4-sidig)', desc: 'Kan delas, putsas på fyra sidor', price: 100 },
  door: { name: 'Balkongdörr', desc: 'Helglas eller spröjsad', price: 100 }
};

const LADDER_PRICE = 0; // Ingen extra avgift för stege
const SPROJS_PRICE = 0; // Befintlig implementering: 0 kr (inräknat)
const INGLASAD_PRICE = 0; // Befintlig implementering: 0 kr (inräknat)
const MIN_PRICE = 700;
const MIN_RUT_PRICE = 350;

export default function CalculatorForm({ initialService, initialCity, onSubmitSuccess }: CalculatorFormProps) {
  // 1: Fönster, 2: Tillval, 3: Kontakt, 4: Pris, 5: Tack/Done
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Cached tracking params
  const [utmParams, setUtmParams] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tracking: { [key: string]: string } = {};
    ['gclid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      const val = params.get(key);
      if (val) tracking[key] = val;
    });
    setUtmParams(tracking);
  }, []);

  // Form State: Window Counts
  const [counts, setCounts] = useState<{ w2: number; w4: number; door: number }>({
    w2: 0,
    w4: 0,
    door: 0
  });

  // Tillval State
  const [ladder, setLadder] = useState<boolean>(false);
  const [sprojs, setSprojs] = useState<boolean>(false);
  const [inglasad, setInglasad] = useState<boolean>(false);
  const [rut, setRut] = useState<boolean>(true);

  // Contact State
  const [name, setName] = useState<string>('');
  const [city, setCity] = useState<string>(initialCity !== undefined ? initialCity : (getCityFromURL() || ''));
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // UI / Error State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [calcError, setCalcError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string | number | null>(null);
  const [hasFiredPartial, setHasFiredPartial] = useState<boolean>(false);

  // In-form calculation loading state (between Step 3 and Step 4)
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<number>(0);

  const loadingSteps = [
    {
      title: "Sedan 1998",
      subtitle: `Analyserar bostadsstorlek och rumsfördelning i ${city || 'Borås'}...`
    },
    {
      title: "100% Nöjdhetsgaranti",
      subtitle: `Tillämpar RUT-avdrag (50%) och fast prisgaranti...`
    },
    {
      title: "Kollektivavtal & Försäkrade",
      subtitle: `Slutför din bokningsförfrågan...`
    }
  ];

  // Persistent Trust strip element displayed on every step before submission
  const trustStrip = (
    <div className="flex flex-col items-center gap-1 pt-1 select-none">
      <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500 stroke-[3]" /> Fast pris</span>
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500 stroke-[3]" /> Inga dolda avgifter</span>
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500 stroke-[3]" /> Pris efter RUT</span>
      </div>
      <div className="text-[10.5px] text-gray-400 font-medium">
        (Utkörningsavgift tillkommer)
      </div>
    </div>
  );

  // Sync initial city
  useEffect(() => {
    if (initialCity !== undefined) {
      setCity(initialCity);
    } else {
      const autoCity = getCityFromURL();
      if (autoCity) setCity(autoCity);
    }
  }, [initialCity]);

  // Total window items count
  const totalItemsCount = counts.w2 + counts.w4 + counts.door;

  // Price Calculation Logic matching reference
  const calculatePrice = () => {
    let sub = (counts.w2 * SERVICES.w2.price) + (counts.w4 * SERVICES.w4.price) + (counts.door * SERVICES.door.price);
    if (ladder) sub += LADDER_PRICE;
    if (sprojs) sub += SPROJS_PRICE;
    if (inglasad) sub += INGLASAD_PRICE;
    const finalPrice = rut ? Math.max(Math.round(sub * 0.5), MIN_RUT_PRICE) : Math.max(sub, MIN_PRICE);
    return {
      subtotal: sub,
      price: finalPrice,
      formatted: `${finalPrice.toLocaleString('sv-SE')} kr`
    };
  };

  const priceInfo = calculatePrice();

  // Helper text summary for chosen items
  const getSelectedItemsSummary = () => {
    const list: string[] = [];
    if (counts.w2 > 0) list.push(`${counts.w2} × Standardfönster (2-sidig)`);
    if (counts.w4 > 0) list.push(`${counts.w4} × Standardfönster (4-sidig)`);
    if (counts.door > 0) list.push(`${counts.door} × Balkongdörr`);
    return list;
  };

  const getFullBreakdownText = () => {
    const selected = getSelectedItemsSummary();
    const tillvalList: string[] = [];
    if (ladder) tillvalList.push("Krävs stege (höga fönster)");
    if (sprojs) tillvalList.push("Spröjsade fönster");
    if (inglasad) tillvalList.push("Inglasad altan/balkong");

    let text = `Fönsterputsning: ${selected.join(', ')}`;
    if (tillvalList.length > 0) {
      text += ` | Tillval: ${tillvalList.join(', ')}`;
    }
    text += ` | RUT-avdrag: ${rut ? 'Ja (50%)' : 'Nej'}`;
    text += ` | Beräknat pris: ${priceInfo.formatted}`;
    return text;
  };

  // Step 1: Next
  const handleStep1Next = () => {
    if (totalItemsCount === 0) {
      setCalcError(true);
      return;
    }
    setCalcError(false);
    setStep(2);
  };

  // Step 2: Next
  const handleStep2Next = () => {
    setStep(3);
  };

  // Step 3: Next (validate & submit partial lead)
  const handleStep3Next = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Ange ditt namn';
    if (!city.trim()) newErrors.city = 'Ange din stad';

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      newErrors.phone = 'Ange ett giltigt telefonnummer';
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Ange en giltig e-postadress';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsCalculating(true);
    setLoadingPhase(0);

    // Trigger generate_lead event to dataLayer on Step 3 [Visa mitt pris →]
    pushLeadToDataLayer(name, email, phone, city, getFullBreakdownText());

    // Send partial lead (button_click = "no")
    if (!hasFiredPartial) {
      try {
        const fullMessage = getFullBreakdownText();
        const payload: FormValues = {
          name,
          phone,
          email,
          city,
          address: city,
          number_of_windows: totalItemsCount,
          number_of_sides: counts.w4 > 0 ? 4 : 2,
          window_details: {
            standard2: counts.w2,
            standard4: counts.w4,
            door: counts.door,
            ladder,
            sprojs,
            inglasad,
            rut
          },
          suggested_price: priceInfo.price,
          suggestedPrice: priceInfo.formatted,
          message: fullMessage,
          comment: fullMessage,
          service_type: 'Fönsterputsning',
          user_type: 'Privatperson',
          button_click: 'no',
          is_button_click: 'no',
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_term: utmParams.utm_term,
          utm_content: utmParams.utm_content,
          gclid: utmParams.gclid,
          fbclid: utmParams.fbclid
        };

        submitLeadToCRM(payload)
          .then((data) => {
            const id = data?.id || data?.data?.id || data?.data?.customer_id;
            if (id) setCustomerId(id);
            setHasFiredPartial(true);
          })
          .catch((err) => console.error("Partial lead error:", err));
      } catch (e) {
        console.error("Failed submitting partial lead:", e);
      }
    }

    // In-form animation cycling through benefits before revealing price
    let phase = 0;
    const interval = setInterval(() => {
      phase = (phase + 1) % 3;
      setLoadingPhase(phase);
    }, 700);

    setTimeout(() => {
      clearInterval(interval);
      setIsCalculating(false);
      setStep(4);
    }, 2200);
  };

  // Step 4: Final Submit
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fullMessage = getFullBreakdownText();
      const payload: FormValues = {
        name,
        phone,
        email,
        city,
        address: city,
        number_of_windows: totalItemsCount,
        number_of_sides: counts.w4 > 0 ? 4 : 2,
        window_details: {
          standard2: counts.w2,
          standard4: counts.w4,
          door: counts.door,
          ladder,
          sprojs,
          inglasad,
          rut
        },
        suggested_price: priceInfo.price,
        suggestedPrice: priceInfo.formatted,
        message: fullMessage,
        comment: fullMessage,
        service_type: 'Fönsterputsning',
        user_type: 'Privatperson',
        button_click: 'yes',
        is_button_click: 'yes',
        customer_id: customerId || undefined,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term,
        utm_content: utmParams.utm_content,
        gclid: utmParams.gclid,
        fbclid: utmParams.fbclid
      };

      const data = await submitLeadToCRM(payload);

      const idToUpdate = customerId || data?.id || data?.data?.id || data?.data?.customer_id;
      if (idToUpdate) {
        fetch("/api/update-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: 4,
            customer_id: idToUpdate,
            name,
            email,
            phone,
            city,
            comment: fullMessage,
            message: fullMessage,
            button_click: "yes",
            is_button_click: "yes"
          })
        }).catch(err => console.error("Update lead error:", err));
      }

      // Fire interested_for_booking event on [Skicka förfrågan]
      pushBookingIntentToDataLayer(city);

      onSubmitSuccess('fonster', city);
      setStep(5);
    } catch (e) {
      console.error("Submission error:", e);
      pushBookingIntentToDataLayer(city);
      onSubmitSuccess('fonster', city);
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCounts({ w2: 0, w4: 0, door: 0 });
    setLadder(false);
    setSprojs(false);
    setInglasad(false);
    setRut(true);
    setName('');
    setPhone('');
    setEmail('');
    setErrors({});
    setCalcError(false);
    setIsCalculating(false);
    setStep(1);
  };

  // Stepper Indicator UI
  const stepperLabels = [
    { num: 1, label: 'Fönster' },
    { num: 2, label: 'Tillval' },
    { num: 3, label: 'Kontakt' },
    { num: 4, label: 'Pris' }
  ];

  return (
    <div className="w-full bg-[#f7f7f6] rounded-3xl border border-gray-200/80 shadow-xl p-5 md:p-7" id="calculator-form-container">
      
      {/* 4-Step Stepper Progress Bar */}
      {step !== 5 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-5 select-none" id="form-progress-bar">
          {stepperLabels.map((s, idx) => {
            const currentNum = isCalculating ? 4 : step;
            const isActive = currentNum === s.num;
            const isDone = currentNum > s.num;

            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border transition-all duration-200 ${
                      isDone
                        ? 'bg-brand border-brand text-white'
                        : isActive
                        ? 'bg-brand border-brand text-white shadow-md ring-4 ring-brand/20'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-semibold mt-1 tracking-tight ${isActive ? 'text-brand font-bold' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>

                {idx < stepperLabels.length - 1 && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 mx-1 sm:mx-1.5 rounded-full transition-colors duration-300 ${
                      step > s.num ? 'bg-brand' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 1: FÖNSTER */}
      {step === 1 && (
        <div className="space-y-4 animate-step-in" id="stepperForm">
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight font-display">
              Räkna ut pris för fönsterputsning
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Få ditt fasta pris direkt online på under 60 sekunder.
            </p>
          </div>

          {/* Pre-selected Service Banner */}
          <div className="bg-red-50/60 border border-brand/40 rounded-xl p-3 flex items-center gap-3 w-full shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-white border border-red-100 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4C44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="1.5" />
                <path d="M12 3v18M4 12h16" />
              </svg>
            </div>
            <div className="text-left flex-1 min-w-0">
              <strong className="text-gray-900 text-xs sm:text-sm font-bold block">Fönsterputsning</strong>
              <p className="text-xs text-gray-500 mt-0.5 truncate">Fönster och balkongdörrar, in- och utsida</p>
            </div>
            <span className="text-brand font-bold text-xs bg-white px-2.5 py-1 rounded-full border border-brand/20 shadow-2xs shrink-0">
              Vald
            </span>
          </div>

          {/* Counter Rows */}
          <div className="border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 overflow-hidden shadow-2xs">
            {/* Standardfönster 2-sidig */}
            <div className={`flex items-center justify-between p-3 sm:p-3.5 transition-colors ${counts.w2 > 0 ? 'bg-[#FFF8F8]' : ''}`}>
              <div className="flex-1 pr-2">
                <div className="text-xs sm:text-sm font-bold text-gray-900">Standardfönster (2-sidig)</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Putsas in- och utsida</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => ({ ...prev, w2: Math.max(0, prev.w2 - 1) }));
                    setCalcError(false);
                  }}
                  disabled={counts.w2 === 0}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer text-base active:scale-95"
                  aria-label="Minska standardfönster 2-sidig"
                >
                  −
                </button>
                <div className="w-7 text-center font-bold text-sm sm:text-base text-gray-900 tabular-nums">
                  {counts.w2}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => ({ ...prev, w2: prev.w2 + 1 }));
                    setCalcError(false);
                  }}
                  className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-brand font-bold hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer text-base active:scale-95"
                  aria-label="Öka standardfönster 2-sidig"
                >
                  +
                </button>
              </div>
            </div>

            {/* Standardfönster 4-sidig */}
            <div className={`flex items-center justify-between p-3 sm:p-3.5 transition-colors ${counts.w4 > 0 ? 'bg-[#FFF8F8]' : ''}`}>
              <div className="flex-1 pr-2">
                <div className="text-xs sm:text-sm font-bold text-gray-900">Standardfönster (4-sidig)</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Kan delas, putsas på fyra sidor</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => ({ ...prev, w4: Math.max(0, prev.w4 - 1) }));
                    setCalcError(false);
                  }}
                  disabled={counts.w4 === 0}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer text-base active:scale-95"
                  aria-label="Minska standardfönster 4-sidig"
                >
                  −
                </button>
                <div className="w-7 text-center font-bold text-sm sm:text-base text-gray-900 tabular-nums">
                  {counts.w4}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => ({ ...prev, w4: prev.w4 + 1 }));
                    setCalcError(false);
                  }}
                  className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-brand font-bold hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer text-base active:scale-95"
                  aria-label="Öka standardfönster 4-sidig"
                >
                  +
                </button>
              </div>
            </div>

            {/* Balkongdörr */}
            <div className={`flex items-center justify-between p-3 sm:p-3.5 transition-colors ${counts.door > 0 ? 'bg-[#FFF8F8]' : ''}`}>
              <div className="flex-1 pr-2">
                <div className="text-xs sm:text-sm font-bold text-gray-900">Balkongdörr</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Helglas eller spröjsad</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => ({ ...prev, door: Math.max(0, prev.door - 1) }));
                    setCalcError(false);
                  }}
                  disabled={counts.door === 0}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer text-base active:scale-95"
                  aria-label="Minska balkongdörr"
                >
                  −
                </button>
                <div className="w-7 text-center font-bold text-sm sm:text-base text-gray-900 tabular-nums">
                  {counts.door}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => ({ ...prev, door: prev.door + 1 }));
                    setCalcError(false);
                  }}
                  className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-brand font-bold hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer text-base active:scale-95"
                  aria-label="Öka balkongdörr"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {calcError && (
            <div className="text-xs text-red-600 font-semibold text-center bg-red-50 py-1.5 px-3 rounded-lg border border-red-200 animate-shake">
              Välj minst ett fönster eller en dörr.
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStep1Next}
              className="btn-primary w-full shadow-md cursor-pointer"
            >
              <span>Fortsätt →</span>
            </button>
          </div>

          {/* Trust strip */}
          {trustStrip}
        </div>
      )}

      {/* STEP 2: TILLVAL */}
      {step === 2 && (
        <div className="space-y-4 animate-step-in" id="stepperForm">
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight font-display">
              Tillval
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Behövs stege, och vill du använda RUT-avdrag?
            </p>
          </div>

          {/* Toggle items */}
          <div className="space-y-2.5">
            {/* Krävs stege? */}
            <button
              type="button"
              onClick={() => setLadder(!ladder)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                ladder ? 'bg-[#FFF8F8] border-brand/50 shadow-2xs' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              role="switch"
              aria-checked={ladder}
            >
              <div className="flex-1 pr-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900">Krävs stege?</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Om fönstren når högt</div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${ladder ? 'bg-brand' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${ladder ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            {/* Spröjsade fönster */}
            <button
              type="button"
              onClick={() => setSprojs(!sprojs)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                sprojs ? 'bg-[#FFF8F8] border-brand/50 shadow-2xs' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              role="switch"
              aria-checked={sprojs}
            >
              <div className="flex-1 pr-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900">Spröjsade fönster</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Putsning av spröjsade glasytor</div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${sprojs ? 'bg-brand' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${sprojs ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            {/* Inglasad altan / balkong */}
            <button
              type="button"
              onClick={() => setInglasad(!inglasad)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                inglasad ? 'bg-[#FFF8F8] border-brand/50 shadow-2xs' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              role="switch"
              aria-checked={inglasad}
            >
              <div className="flex-1 pr-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900">Inglasad altan / balkong</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Putsning av inglasade glaspartier</div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${inglasad ? 'bg-brand' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${inglasad ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            {/* RUT-avdrag */}
            <button
              type="button"
              onClick={() => setRut(!rut)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                rut ? 'bg-[#FFF8F8] border-brand/50 shadow-2xs' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              role="switch"
              aria-checked={rut}
            >
              <div className="flex-1 pr-3">
                <div className="text-xs sm:text-sm font-bold text-gray-900">RUT-avdrag (50%)</div>
                <div className="text-[11px] sm:text-xs text-gray-500">Vi drar av direkt på fakturan</div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${rut ? 'bg-brand' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${rut ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary !w-auto min-w-[90px] sm:min-w-[105px] px-3.5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
            >
              <span>‹ Tillbaka</span>
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              className="btn-primary flex-1 shadow-md cursor-pointer"
            >
              <span>Se pris →</span>
            </button>
          </div>

          {/* Trust strip */}
          {trustStrip}
        </div>
      )}

      {/* STEP 3: KONTAKT */}
      {!isCalculating && step === 3 && (
        <div className="space-y-4 animate-step-in" id="stepperForm">
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight font-display">
              Dina kontaktuppgifter
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Vi behöver dina kontaktuppgifter för att kunna lämna en prisuppgift.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Namn */}
            <div className="space-y-1">
              <label htmlFor="fp-name" className="text-xs font-bold text-gray-800 flex items-center gap-0.5">
                <span>Namn</span>
                <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="fp-name"
                  placeholder="För- och efternamn"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  autoComplete="name"
                  className={`w-full bg-white border ${
                    errors.name ? '!border-red-500 ring-1 ring-red-500' : 'border-[#D5D8DC]'
                  } focus:!border-brand rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none`}
                />
              </div>
              {errors.name && <span className="text-[11px] text-red-500 font-semibold block">⚠ {errors.name}</span>}
            </div>

            {/* Stad */}
            <div className="space-y-1">
              <label htmlFor="fp-city" className="text-xs font-bold text-gray-800 flex items-center gap-0.5">
                <span>Stad</span>
                <span className="text-brand">*</span>
              </label>
              <CityCombobox
                id="fp-city"
                value={city}
                onChange={(val) => {
                  setCity(val);
                  if (errors.city) setErrors({ ...errors, city: '' });
                }}
                error={errors.city}
              />
              {errors.city && <span className="text-[11px] text-red-500 font-semibold block">⚠ {errors.city}</span>}
            </div>

            {/* Telefon */}
            <div className="space-y-1">
              <label htmlFor="fp-phone" className="text-xs font-bold text-gray-800 flex items-center gap-0.5">
                <span>Telefon</span>
                <span className="text-brand">*</span>
              </label>
              <input
                type="tel"
                id="fp-phone"
                placeholder="070-123 45 67"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                autoComplete="tel"
                className={`w-full bg-white border ${
                  errors.phone ? '!border-red-500 ring-1 ring-red-500' : 'border-[#D5D8DC]'
                } focus:!border-brand rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none`}
              />
              {errors.phone && <span className="text-[11px] text-red-500 font-semibold block">⚠ {errors.phone}</span>}
            </div>

            {/* E-post */}
            <div className="space-y-1">
              <label htmlFor="fp-email" className="text-xs font-bold text-gray-800 flex items-center gap-0.5">
                <span>E-post</span>
                <span className="text-brand">*</span>
              </label>
              <input
                type="email"
                id="fp-email"
                placeholder="namn@exempel.se"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                autoComplete="email"
                className={`w-full bg-white border ${
                  errors.email ? '!border-red-500 ring-1 ring-red-500' : 'border-[#D5D8DC]'
                } focus:!border-brand rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none`}
              />
              {errors.email && <span className="text-[11px] text-red-500 font-semibold block">⚠ {errors.email}</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary !w-auto min-w-[90px] sm:min-w-[105px] px-3.5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
            >
              <span>‹ Tillbaka</span>
            </button>
            <button
              type="button"
              onClick={handleStep3Next}
              className="btn-primary flex-1 shadow-md cursor-pointer"
            >
              <span>Visa mitt pris →</span>
            </button>
          </div>

          {/* Trust strip */}
          {trustStrip}
        </div>
      )}

      {/* IN-CARD LOADING ANIMATION BEFORE STEP 4 (PRICE) */}
      {isCalculating && (
        <div className="py-6 sm:py-8 text-center space-y-4 animate-in fade-in duration-300" id="in-form-calculation-loader">
          {/* Spinning circular loader in brand coral/red */}
          <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-[3.5px] border-red-100 border-t-brand animate-spin"></div>
          </div>

          {/* Dynamic benefits title */}
          <h3 className="text-2xl sm:text-[26px] font-extrabold text-[#2C3E50] font-display mb-1 tracking-tight transition-all duration-300">
            {loadingSteps[loadingPhase].title}
          </h3>

          {/* Dynamic subtitle with city */}
          <p className="text-xs sm:text-sm text-[#7F8C8D] font-normal max-w-sm mx-auto leading-relaxed transition-all duration-300">
            {loadingSteps[loadingPhase].subtitle}
          </p>

          {/* Benefit badges matching screenshot */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap pt-2">
            <span className="bg-[#FFF5F4] text-[#EC4C44] border border-[#FECACA]/70 text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs">
              Sedan 1998
            </span>
            <span className="bg-[#FFF5F4] text-[#EC4C44] border border-[#FECACA]/70 text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs">
              Kollektivavtal
            </span>
            <span className="bg-[#FFF5F4] text-[#EC4C44] border border-[#FECACA]/70 text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs">
              Försäkrade
            </span>
          </div>

          {/* Trust strip */}
          <div className="pt-3 border-t border-gray-100 mt-4">
            {trustStrip}
          </div>
        </div>
      )}

      {/* STEP 4: PRIS */}
      {!isCalculating && step === 4 && (
        <div className="space-y-4 animate-step-in" id="stepperForm">
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight font-display">
              Ditt pris
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Fast pris, inga dolda avgifter.
            </p>
          </div>

          {/* Price Highlight Box */}
          <div className="bg-red-50/70 border border-brand/30 rounded-2xl p-5 text-center shadow-xs">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Uppskattat pris
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-[#17202A] tracking-tight font-display leading-tight tabular-nums">
              {priceInfo.formatted}
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">
              {rut ? 'inkl. moms och RUT-avdrag' : 'inkl. moms'}
            </div>
            <div className="text-[11px] text-gray-500 font-medium mt-1.5 pt-1.5 border-t border-red-100">
              * Utkörningsavgift tillkommer
            </div>
          </div>

          {/* Breakdown Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm">
            {getSelectedItemsSummary().map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-gray-700">
                <span>{item}</span>
                <span className="font-semibold text-gray-900">Inräknat</span>
              </div>
            ))}
            <div className="flex justify-between items-center text-gray-700 border-t border-gray-100 pt-2">
              <span>Krävs stege</span>
              <span className="font-semibold text-gray-900">{ladder ? 'Ja' : 'Nej'}</span>
            </div>
            {sprojs && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Spröjsade fönster</span>
                <span className="font-semibold text-gray-900">Ja</span>
              </div>
            )}
            {inglasad && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Inglasad altan/balkong</span>
                <span className="font-semibold text-gray-900">Ja</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-700 border-t border-gray-100 pt-2">
              <span>RUT-avdrag</span>
              <span className="font-semibold text-emerald-600">{rut ? 'Ja, 50% avdrag' : 'Nej'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-700">
              <span>Stad</span>
              <span className="font-semibold text-gray-900">{city}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={isSubmitting}
              className="btn-secondary !w-auto min-w-[90px] sm:min-w-[105px] px-3.5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
            >
              <span>‹ Tillbaka</span>
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="btn-primary flex-1 shadow-md cursor-pointer !bg-brand hover:!bg-brand-hover"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Skickar...</span>
                </>
              ) : (
                <span>Skicka förfrågan</span>
              )}
            </button>
          </div>

          {/* Trust points */}
          {trustStrip}

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Genom att fylla i formuläret godkänner du vår integritetspolicy. Vi delar aldrig dina uppgifter.
          </p>
        </div>
      )}

      {/* STEP 5: TACK / DONE IN-CARD (Fallback view if route doesn't navigate) */}
      {step === 5 && (
        <div className="space-y-4 animate-step-in text-center py-4" id="stepperForm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 font-display">
            Tack, {name ? name.trim().split(' ')[0] : 'för din förfrågan'}!
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            Vi har tagit emot din förfrågan och hör av oss inom kort för att boka in fönsterputsen i {city || 'ditt område'}.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary w-auto mx-auto px-6 cursor-pointer"
            >
              Gör en ny beräkning
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
