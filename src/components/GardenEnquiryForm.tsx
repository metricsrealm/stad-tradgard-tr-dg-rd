import React, { useState, useEffect } from 'react';
import { DatePicker } from './DatePicker';
import type { FormValues } from '../types';

export const GARDEN_SERVICES = [
  'Gräsklippning',
  'Beskärning',
  'Ogräsrensning',
  'Stenrengöring',
  'Terrasstvätt',
  'Höst- & Vårstädning'
] as const;

export type GardenServiceOption = typeof GARDEN_SERVICES[number];

interface GardenEnquiryFormProps {
  initialService?: string;
  initialCity?: string;
  onPrivacyClick?: () => void;
  onSubmitSuccess?: (services: string[], city: string) => void;
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

export default function GardenEnquiryForm({
  initialService,
  initialCity,
  onPrivacyClick,
  onSubmitSuccess
}: GardenEnquiryFormProps) {
  // Step 1: Kontakt, Step 2: Tjänster, Step 3: Klart
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>(['Gräsklippning']);
  const [city, setCity] = useState<string>(initialCity !== undefined ? initialCity : (getCityFromURL() || ''));
  const [desiredDate, setDesiredDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Field error states
  const [nameError, setNameError] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<boolean>(false);
  const [serviceError, setServiceError] = useState<boolean>(false);
  const [cityError, setCityError] = useState<boolean>(false);
  const [dateError, setDateError] = useState<boolean>(false);

  // Move focus to the first invalid field so the user sees what is missing
  const focusFirst = (ids: (string | false)[]) => {
    const id = ids.find(Boolean) as string | undefined;
    const el = id ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  };

  // Sync initial city
  useEffect(() => {
    if (initialCity) {
      setCity(initialCity);
    } else {
      const autoCity = getCityFromURL();
      if (autoCity) setCity(autoCity);
    }
  }, [initialCity]);

  // Sync selected service if changed from outside (e.g. clicking a service card)
  useEffect(() => {
    if (initialService) {
      const normalized = initialService.includes('Höst') || initialService.includes('Vår')
        ? 'Höst- & Vårstädning'
        : initialService;
      setSelectedServices((prev) => {
        if (!prev.includes(normalized)) {
          return [normalized, ...prev];
        }
        return prev;
      });
      setServiceError(false);
      if (step === 3) setStep(1);
    }
  }, [initialService]);

  const toggleService = (svc: string) => {
    setSelectedServices((prev) => {
      const next = prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc];
      if (next.length > 0) setServiceError(false);
      return next;
    });
  };

  // Step 1 (Kontakt) -> Step 2 (Tjänster)
  const handleStep1Next = () => {
    const isNameBad = name.trim().length < 2;
    const isPhoneBad = phone.replace(/\D/g, '').length < 7;
    const isEmailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

    setNameError(isNameBad);
    setPhoneError(isPhoneBad);
    setEmailError(isEmailBad);

    if (isNameBad || isPhoneBad || isEmailBad) {
      focusFirst([isNameBad && 'name', isPhoneBad && 'phone', isEmailBad && 'email']);
      return;
    }

    setStep(2);
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'garden_form_step', step: 2 });
    } catch (e) {}
  };

  // Step 2 (Tjänster) -> Step 1 (Kontakt)
  const handleBackToStep1 = () => {
    setStep(1);
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'garden_form_step', step: 1 });
    } catch (e) {}
  };

  // Step 2 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const isServiceBad = selectedServices.length === 0;
    const isCityBad = city.trim().length < 2;
    const isDateBad = !desiredDate;

    setServiceError(isServiceBad);
    setCityError(isCityBad);
    setDateError(isDateBad);

    if (isServiceBad || isCityBad || isDateBad) {
      focusFirst([
        isServiceBad && 'services',
        isCityBad && 'city',
        isDateBad && 'desired-date'
      ]);
      return;
    }


    setIsSubmitting(true);

    const searchParams = new URLSearchParams(window.location.search);
    const tracking = {
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      utm_term: searchParams.get('utm_term') || '',
      utm_content: searchParams.get('utm_content') || '',
      gclid: searchParams.get('gclid') || '',
      fbclid: searchParams.get('fbclid') || ''
    };

    const chosenServicesText = selectedServices.join(', ');
    const fullMessage = `Önskade trädgårdstjänster: ${chosenServicesText}\nOrt: ${city.trim()}\nÖnskat datum: ${desiredDate}`;

    // The CRM only accepts Fönsterputsning / Hemstäd / Flyttstädning / Företagskunder,
    // so garden leads go in as Hemstäd. The `form` name and the services list
    // show it is a garden lead.
    const payload: FormValues & Record<string, unknown> = {
      service_type: 'Hemstäd',
      form: 'Trädgårdsservice Landing Page',
      garden_services: selectedServices,
      desired_date: desiredDate,
      landing_page_url: window.location.href,
      offer_service: selectedServices[0] || 'Trädgårdsservice',
      potential_service: chosenServicesText,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: city.trim(),
      cleaningDate: desiredDate,
      cleaning_date: desiredDate,
      message: fullMessage,
      comment: fullMessage,
      button_click: 'yes',
      is_button_click: 'yes',
      user_type: 'Privatperson',
      ...tracking
    };

    // Track GTM dataLayer
    try {
      const dataLayer = (window as any).dataLayer || [];
      const parts = name.trim().split(/\s+/);
      dataLayer.push({
        event: 'generate_lead',
        form_name: 'tradgardsservice',
        services: chosenServicesText,
        desired_date: desiredDate,
        user_data: {
          email: email.trim().toLowerCase(),
          phone_number: phone.trim(),
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          address: { city: city.trim() }
        }
      });
      dataLayer.push({
        event: 'interested_for_booking',
        service: 'tradgardsservice',
        specific_services: selectedServices,
        desired_date: desiredDate,
        city: city.trim(),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('dataLayer tracking error:', err);
    }

    // Send direct to the CRM. Only works when the page runs on stadochtradgard.se (CRM CORS rule).
    const submitDirect = () =>
      fetch('https://stadochtradgard.se/dashboard/submit_form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((err) => console.error('Direct CRM submission failed:', err));

    try {
      // Main path: our server-side proxy, which isn't affected by CORS
      const resp = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // Proxy missing or failing (not a validation error) -> try the CRM directly
      if (!resp.ok && resp.status !== 400) await submitDirect();
    } catch (err) {
      console.error('Form submission error:', err);
      await submitDirect();
    } finally {
      setIsSubmitting(false);
      setStep(3);
      if (onSubmitSuccess) {
        onSubmitSuccess(selectedServices, city);
      }
    }
  };

  return (
    <div className="card" id="offert">
      {/* Step Indicators: 1 Kontakt -> 2 Tjänster -> 3 Klart */}
      <div className="steps" id="steps" aria-hidden="true">
        <div className={`st ${step === 1 ? 'on' : step > 1 ? 'done' : ''}`}>
          <i>
            {step > 1 ? (
              <svg className="ico"><use href="#i-check" /></svg>
            ) : (
              '1'
            )}
          </i>
          <span>Kontakt</span>
        </div>

        <div className={`ln ${step > 1 ? 'fill' : ''}`}></div>

        <div className={`st ${step === 2 ? 'on' : step > 2 ? 'done' : ''}`}>
          <i>
            {step > 2 ? (
              <svg className="ico"><use href="#i-check" /></svg>
            ) : (
              '2'
            )}
          </i>
          <span>Tjänster</span>
        </div>

        <div className={`ln ${step === 3 ? 'fill' : ''}`}></div>

        <div className={`st ${step === 3 ? 'done' : ''}`}>
          <i>
            {step === 3 ? (
              <svg className="ico"><use href="#i-check" /></svg>
            ) : (
              '3'
            )}
          </i>
          <span>Klart</span>
        </div>
      </div>

      <form id="lead" onSubmit={handleSubmit} noValidate>
        {/* Step 1: Kontakt */}
        <div className={`panel ${step === 1 ? 'show' : ''}`} data-step="1">
          <h2>Dina kontaktuppgifter</h2>
          <p className="sub">Fyll i dina uppgifter så kontaktar vi dig inom 24 timmar.</p>

          {/* Selected Service Card */}
          <div className="selected-service-card">
            <div className="ssc-info">
              <div className="ssc-icon" aria-hidden="true">
                <span className="ssc-emoji">🍂</span>
              </div>
              <div>
                <div className="ssc-title">Trädgårdsservice</div>
                <div className="ssc-desc">Inkl. RUT-avdrag direkt &amp; 100% nöjdhetsgaranti</div>
              </div>
            </div>
            <span className="ssc-badge">Vald</span>
          </div>

          {/* Namn and Telefon on the same row */}
          <div className="field-row">
            <div className="field">
              <label htmlFor="name">
                Namn <b>*</b>
              </label>
              <div className={`inp ${nameError ? 'err' : ''}`}>
                <svg className="ico"><use href="#i-user" /></svg>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="För- och efternamn"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                />
              </div>
              <p className={`msg ${nameError ? 'show' : ''}`}>Ange namn.</p>
            </div>

            <div className="field">
              <label htmlFor="phone">
                Telefon <b>*</b>
              </label>
              <div className={`inp ${phoneError ? 'err' : ''}`}>
                <svg className="ico"><use href="#i-phone" /></svg>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="070-123 45 67"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(false);
                  }}
                />
              </div>
              <p className={`msg ${phoneError ? 'show' : ''}`}>Ange telefonnummer.</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">
              E-post <b>*</b>
            </label>
            <div className={`inp ${emailError ? 'err' : ''}`}>
              <svg className="ico"><use href="#i-mail" /></svg>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="namn@exempel.se"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
              />
            </div>
            <p className={`msg ${emailError ? 'show' : ''}`}>Ange en giltig e-postadress.</p>
          </div>

          <button type="button" className="go" onClick={handleStep1Next} data-next>
            Fortsätt <svg className="ico"><use href="#i-arrow" /></svg>
          </button>
        </div>

        {/* Step 2: Tjänster (3 by 3 list) & Ort / Område */}
        <div className={`panel ${step === 2 ? 'show' : ''}`} data-step="2">
          <h2>Välj trädgårdstjänster</h2>
          <p className="sub">Berätta vad du behöver hjälp med så lämnar vi offert.</p>

          <div className="fl">
            <span>
              Välj trädgårdstjänst <b>*</b>
            </span>
            <small>50% RUT-avdrag</small>
          </div>

          {/* 2-column grid for services */}
          <div
            className={`checks checks-3by3 ${serviceError ? 'has-err' : ''}`}
            id="services"
            role="group"
            aria-label="Välj trädgårdstjänst"
            tabIndex={-1}
          >
            {GARDEN_SERVICES.map((svc) => {
              const isChecked = selectedServices.includes(svc);
              return (
                <label key={svc} className="check">
                  <input
                    type="checkbox"
                    name="service"
                    value={svc}
                    checked={isChecked}
                    onChange={() => toggleService(svc)}
                  />
                  <span>{svc}</span>
                </label>
              );
            })}
          </div>

          <p className={`msg ${serviceError ? 'show' : ''}`} id="err-service">
            Välj minst en tjänst för att gå vidare.
          </p>

          {/* Ort + Önskat datum */}
          <div className="field-row field-row-keep">
            <div className="field">
              <label htmlFor="city">
                Ort / Område <b>*</b>
              </label>
              <div className={`inp ${cityError ? 'err' : ''}`}>
                <svg className="ico"><use href="#i-pin" /></svg>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Din stad"
                  autoComplete="address-level2"
                  required
                  aria-invalid={cityError || undefined}
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (cityError) setCityError(false);
                  }}
                />
              </div>
              <p className={`msg ${cityError ? 'show' : ''}`}>Ange ort.</p>
            </div>

            <div className="field">
              <label htmlFor="desired-date">
                Önskat datum <b>*</b>
              </label>
              <DatePicker
                id="desired-date"
                value={desiredDate}
                error={dateError}
                onChange={(d) => {
                  setDesiredDate(d);
                  if (d) setDateError(false);
                }}
                placeholder="Välj datum"
                headerTitle="Välj önskat startdatum"
              />
              <p className={`msg ${dateError ? 'show' : ''}`}>Välj ett datum.</p>
            </div>
          </div>

          <div className="row">
            <button
              type="button"
              className="back"
              onClick={handleBackToStep1}
              data-back
              aria-label="Tillbaka till kontaktuppgifter"
            >
              <svg className="ico"><use href="#i-left" /></svg>Tillbaka
            </button>
            <button type="submit" className="go" id="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Skickar...'
              ) : (
                <>
                  Skicka förfrågan <svg className="ico"><use href="#i-arrow" /></svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 3: thank you */}
        <div className={`panel ${step === 3 ? 'show' : ''}`} data-step="3">
          <div className="thanks" role="status" aria-live="polite">
            <div className="big">
              <svg className="ico"><use href="#i-check" /></svg>
            </div>
            <h2>Tack för din förfrågan!</h2>
            <p>Vi kontaktar dig inom 24 timmar för genomgång och kostnadsfri offert.</p>
            <div className="sel" id="chosen">
              {selectedServices.map((s) => (
                <span key={s}>{s}</span>
              ))}
              {desiredDate && <span>📅 {desiredDate}</span>}
              {city && <span>📍 {city}</span>}
            </div>
          </div>
        </div>
      </form>

      {/* Card Foot (hidden on Step 3). On Step 2, trust guarantees are hidden per user request */}
      {step !== 3 && (
        <div id="card-foot" className={step === 2 ? 'no-ticks' : ''}>
          {step === 1 && (
            <div className="ticks">
              <span>
                <svg className="ico"><use href="#i-check" /></svg>50% RUT-avdrag direkt
              </span>
              <span>
                <svg className="ico"><use href="#i-check" /></svg>Kostnadsfri offert
              </span>
              <span>
                <svg className="ico"><use href="#i-check" /></svg>100% Nöjdhetsgaranti
              </span>
            </div>
          )}
          <p className="note">
            Genom att fylla i formuläret godkänner du vår{' '}
            <button
              type="button"
              onClick={onPrivacyClick}
              className="underline text-inherit cursor-pointer"
            >
              integritetspolicy
            </button>
            . Vi delar aldrig dina uppgifter.
          </p>
        </div>
      )}
    </div>
  );
}
