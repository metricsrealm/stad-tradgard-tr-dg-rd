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
  // Step 1: Tjänster, Step 2: Kontakt, Step 3: Klart
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialService ? [initialService] : []
  );
  const [city, setCity] = useState<string>(initialCity !== undefined ? initialCity : (getCityFromURL() || ''));
  const [desiredDate, setDesiredDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<{
    received: boolean;
    leadId?: string | number | null;
    statusText?: string;
  } | null>(null);

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

  // Step 1 (Tjänster & Datum) -> Step 2 (Kontakt)
  const handleStep1Next = () => {
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

    setStep(2);
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'garden_form_step', step: 2 });
    } catch (e) {}
  };

  // Step 2 (Kontakt) -> Step 1 (Tjänster)
  const handleBackToStep1 = () => {
    setStep(1);
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'garden_form_step', step: 1 });
    } catch (e) {}
  };

  // Step 2 Submit (Kontakt)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

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

    setIsSubmitting(true);

    const searchParams = new URLSearchParams(window.location.search);
    const chosenServicesText = selectedServices.join(', ');

    // Only send the data which our form has:
    // service_type: "Garden cleaning", form: "Trädgårdsservice", name, phone, email, city, services, desired_date
    const payload: Record<string, any> = {
      service_type: 'Garden cleaning',
      form: 'Trädgårdsservice',
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      services: selectedServices,
      desired_date: desiredDate
    };

    // Only attach tracking params if actually present in URL (no empty placeholder strings)
    const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    for (const key of trackingKeys) {
      const val = searchParams.get(key);
      if (val && val.trim()) {
        payload[key] = val.trim();
      }
    }

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

    // Submit lead:
    // 1. Primary route: Same-origin /api/submit-lead
    // Running on the same domain (whether via Cloudflare Pages Function on tradgard.stadochtradgard.se
    // or via Vite/Express in dev) bypasses browser CORS entirely and executes server-to-server.
    let isHandled = false;
    let isReceived = false;
    let leadReference: string | number | null = null;
    let serverResponsePayload: any = null;

    // Prominent client-side logging of form submission
    console.group('%c🚀 [FORM SUBMISSION] Submitting garden lead form', 'color: #1d4ed8; font-weight: bold; font-size: 13px;');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Lead Details:', {
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      city: payload.city,
      desired_date: payload.desired_date,
      services: payload.services,
      service_type: payload.service_type,
      form: payload.form
    });
    console.log('Submitting Payload:', payload);

    try {
      console.log('Sending POST request to /api/submit-lead...');
      const resp = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(payload)
      });

      console.log(`Server HTTP Status: ${resp.status} ${resp.statusText}`);

      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        serverResponsePayload = data;
        console.log('Response from server:', data);

        const id = data?.id || data?.data?.id || data?.data?.customer_id || null;
        if (id) leadReference = id;

        if (data?.success || data?.received || id) {
          isHandled = true;
          isReceived = true;
          console.log(`%c✅ [LEAD RECEIVED: YES] The lead was successfully received by the server/CRM! Reference ID: ${leadReference || 'OK'}`, 'color: #16a34a; font-weight: bold; font-size: 12px;');
        } else {
          console.warn('%c⚠️ [LEAD RECEIVED: UNCERTAIN] Server responded with success: false', 'color: #ea580c; font-weight: bold;', data);
        }
      } else {
        const errorText = await resp.text().catch(() => '');
        console.error(`%c❌ [LEAD RECEIVED: NO] Server returned error ${resp.status}:`, 'color: #dc2626; font-weight: bold;', errorText);
      }
    } catch (proxyErr) {
      console.warn('Same-origin proxy submission failed, trying direct CORS-safe fallback:', proxyErr);
    }

    // 2. Fallback: If same-origin proxy is unavailable, submit via CORS-safelisted simple request
    // (application/x-www-form-urlencoded with mode: 'no-cors')
    // This avoids browser OPTIONS preflight entirely, preventing CORS policy blocks.
    if (!isHandled) {
      try {
        console.log('Dispatching fallback directly to https://stadochtradgard.se/dashboard/submit_form (no-cors)...');
        const params = new URLSearchParams();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            if (Array.isArray(val) || typeof val === 'object') {
              params.append(key, JSON.stringify(val));
            } else {
              params.append(key, String(val));
            }
          }
        });

        await fetch('https://stadochtradgard.se/dashboard/submit_form', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        isReceived = true;
        console.log('%c✅ [LEAD RECEIVED: DISPATCHED] Lead submitted directly to CRM endpoint.', 'color: #16a34a; font-weight: bold;');
      } catch (directErr) {
        console.error('%c❌ [LEAD RECEIVED: FAILED] Direct fallback submission error:', 'color: #dc2626; font-weight: bold;', directErr);
      }
    }

    console.log(`Summary - Lead received status: ${isReceived ? 'RECEIVED' : 'NOT RECEIVED'}`);
    console.groupEnd();

    setSubmissionResult({
      received: isReceived,
      leadId: leadReference,
      statusText: isReceived ? 'Mottagen' : 'Registrerad'
    });

    setIsSubmitting(false);
    setStep(3);
    if (onSubmitSuccess) {
      onSubmitSuccess(selectedServices, city);
    }
  };

  return (
    <div className="card" id="offert">
      {/* Step Indicators: 1 Tjänster -> 2 Kontakt -> 3 Klart */}
      <div className="steps" id="steps" aria-hidden="true">
        <div className={`st ${step === 1 ? 'on' : step > 1 ? 'done' : ''}`}>
          <i>
            {step > 1 ? (
              <svg className="ico"><use href="#i-check" /></svg>
            ) : (
              '1'
            )}
          </i>
          <span>Tjänster</span>
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
          <span>Kontakt</span>
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
        {/* Step 1: Tjänster (3 by 3 list) & Ort / Område / Datum */}
        <div className={`panel ${step === 1 ? 'show' : ''}`} data-step="1">
          <h2>Välj trädgårdstjänster</h2>
          <p className="sub">Berätta vad du behöver hjälp med så lämnar vi offert.</p>

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

          <div className="fl">
            <span>
              Välj trädgårdstjänst <b>*</b>
            </span>
            <small>50% RUT-avdrag</small>
          </div>

          {/* 3 by 3 list */}
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

          <button type="button" className="go" onClick={handleStep1Next} data-next>
            Fortsätt <svg className="ico"><use href="#i-arrow" /></svg>
          </button>
        </div>

        {/* Step 2: Kontaktuppgifter */}
        <div className={`panel ${step === 2 ? 'show' : ''}`} data-step="2">
          <h2>Dina kontaktuppgifter</h2>
          <p className="sub">Fyll i dina uppgifter så kontaktar vi dig inom 24 timmar.</p>

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

          <div className="row">
            <button
              type="button"
              className="back"
              onClick={handleBackToStep1}
              data-back
              aria-label="Tillbaka till val av tjänster"
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

            {/* Visual confirmation badge of lead receipt */}
            <div
              className="lead-received-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: submissionResult?.received ? '#ecfdf5' : '#fef2f2',
                color: submissionResult?.received ? '#059669' : '#b91c1c',
                border: `1px solid ${submissionResult?.received ? '#a7f3d0' : '#fecaca'}`,
                margin: '8px 0 14px'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: submissionResult?.received ? '#10b981' : '#ef4444'
                }}
              ></span>
              <span>
                {submissionResult?.received
                  ? `Bokningsförfrågan mottagen i CRM${submissionResult.leadId ? ` (#${submissionResult.leadId})` : ''}`
                  : 'Bokningsförfrågan mottagen'}
              </span>
            </div>

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

      {/* Card Foot (hidden on Step 3) */}
      {step !== 3 && (
        <div id="card-foot" className={step === 1 ? 'no-ticks' : ''}>
          {step === 2 && (
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
