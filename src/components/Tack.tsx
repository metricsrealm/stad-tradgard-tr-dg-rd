import { useEffect } from 'react';
import { CheckCircle, Phone, ArrowLeft, Star, Mail } from 'lucide-react';

interface TackProps {
  serviceType: string;
  cityName: string;
  onGoBack: () => void;
}

export default function Tack({ serviceType, cityName, onGoBack }: TackProps) {
  useEffect(() => {
    // Scroll to top automatically
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const displayService = serviceType || "Trädgårdsservice";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAFAF8]" id="tack-view">
      <div className="max-w-xl w-full bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-lg text-center relative overflow-hidden">
        
        {/* Confetti-like ambient decoration inside card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-emerald-500 via-brand to-emerald-400"></div>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-6 border border-emerald-100">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-display mb-4" id="tack-header">
          Tack för din förfrågan!
        </h1>

        <p className="text-base md:text-lg text-gray-650 leading-relaxed mb-6">
          Vi har tagit emot dina uppgifter för <strong className="text-brand font-bold">{displayService}</strong> {cityName ? <>i <span className="font-semibold text-gray-900">{cityName}</span></> : ''}.
        </p>

        {/* Dynamic Guarantee Badge */}
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 mb-6 text-left">
          <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Vi stämmer av din förfrågan</span>
          </h2>
          <p className="text-xs md:text-sm text-emerald-700">
            En av våra erfarna trädgårdsspecialister går igenom dina uppgifter och återkommer med ett kostnadsfritt prisförslag eller för att boka ett möte inom 24 timmar.
          </p>
        </div>

        {/* Operational Context Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-xl text-left border border-gray-200/60">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">TELEFONLINJE</span>
            <a href="tel:0101753040" className="flex items-center gap-1.5 font-bold text-gray-800 hover:text-brand text-sm md:text-base">
              <Phone className="w-4 h-4 text-brand" />
              <span>010-175 30 40</span>
            </a>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-left border border-gray-200/60">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">E-POST</span>
            <a href="mailto:info@stadochtradgard.se" className="flex items-center gap-1.5 font-bold text-gray-800 hover:text-brand text-sm md:text-base">
              <Mail className="w-4 h-4 text-brand" />
              <span>info@stadochtradgard.se</span>
            </a>
          </div>
        </div>

        {/* Social proof & back navigation */}
        <div className="border-t border-gray-100 pt-6 flex flex-col items-center gap-3.5">
          <a
            href="https://maps.app.goo.gl/MJpJGKZWUqxDnRWL7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-brand transition-colors cursor-pointer"
          >
            <span className="font-semibold">Vill du se vad andra tycker?</span>
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="ml-1 text-gray-700 font-bold hover:underline">4.8/5 på Google</span>
            </div>
          </a>

          <button
            onClick={onGoBack}
            className="inline-flex items-center justify-center text-sm font-semibold text-gray-700 hover:text-brand transition-all cursor-pointer group"
            id="tack-back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            <span>Gå tillbaka till startsidan</span>
          </button>
        </div>

      </div>
    </div>
  );
}
