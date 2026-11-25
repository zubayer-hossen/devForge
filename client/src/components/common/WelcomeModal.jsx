import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Cpu,
  Pause,
  Play,
  Quote,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';

const AUTO_CLOSE_SECONDS = 12;

const css = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');

.df-bn-font {
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
}

@keyframes df-backdrop-in {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(14px); }
}
@keyframes df-card-reveal {
  0% { opacity: 0; transform: perspective(1000px) rotateX(10deg) translateY(28px) scale(0.95); }
  100% { opacity: 1; transform: perspective(1000px) rotateX(0deg) translateY(0) scale(1); }
}
@keyframes df-orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes df-pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.45; }
  50% { transform: scale(1.05); opacity: 0.85; }
}
@keyframes df-shimmer {
  0% { transform: translateX(-110%) skewX(-16deg); }
  100% { transform: translateX(260%) skewX(-16deg); }
}
@keyframes df-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.df-backdrop { animation: df-backdrop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.df-card-enter { animation: df-card-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.df-orbit { animation: df-orbit-spin 24s linear infinite; }
.df-pulse-ring { animation: df-pulse-ring 4s ease-in-out infinite; }
.df-stagger-1 { animation: df-slide-up 0.45s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both; }
.df-stagger-2 { animation: df-slide-up 0.45s 0.16s cubic-bezier(0.16, 1, 0.3, 1) both; }
.df-stagger-3 { animation: df-slide-up 0.45s 0.24s cubic-bezier(0.16, 1, 0.3, 1) both; }
.df-stagger-4 { animation: df-slide-up 0.45s 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }

.df-btn-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 45%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent);
  animation: df-shimmer 3s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .df-backdrop, .df-card-enter, .df-orbit, .df-pulse-ring, .df-stagger-1, .df-stagger-2, .df-stagger-3, .df-stagger-4, .df-btn-shimmer::after {
    animation: none !important;
  }
}
`;

const INTEREST_TAGS = [
  { id: 'build', label: 'প্রজেক্ট তৈরি', icon: Code2 },
  { id: 'dsa', label: 'সমস্যা সমাধান', icon: Cpu },
  { id: 'collab', label: 'কমিউনিটি ও কোলাবোরেশন', icon: Terminal },
];

const toBengaliDigits = (num) => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
};

const WelcomeModal = ({ onSelectTrack }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(AUTO_CLOSE_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState('build');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const ctaRef = useRef(null);

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleExplore = () => {
    if (onSelectTrack) {
      onSelectTrack(selectedInterest);
    }
    closeModal();
  };

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          setIsOpen(false);
          return 0;
        }
        return +(prev - 0.1).toFixed(1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ctaRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 4, y: x * 4 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsPaused(false);
  };

  if (!isOpen) return null;

  const progressPercentage = (timeLeft / AUTO_CLOSE_SECONDS) * 100;
  const displaySeconds = toBengaliDigits(Math.ceil(timeLeft));

  return (
    <div
      className="df-bn-font df-backdrop fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/80 p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <style>{css}</style>

      {/* কাস্টম SVG আর্চ মাস্ক */}
      <svg width="0" height="0" className="pointer-events-none absolute">
        <defs>
          <clipPath
            id="devforge-arch-mask-bn"
            clipPathUnits="objectBoundingBox"
          >
            <path d="M 0.5,0 C 0.82,0 1,0.18 1,0.48 L 1,0.86 C 1,0.94 0.94,1 0.86,1 L 0.14,1 C 0.06,1 0,0.94 0,0.86 L 0,0.48 C 0,0.18 0.18,0 0.5,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        ref={cardRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.18s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="df-card-enter relative w-full max-w-[880px] overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900 text-white shadow-[0_30px_90px_-15px_rgba(124,58,237,0.45)]"
      >
        {/* ব্যাকগ্রাউন্ড গ্লো */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-600/25 blur-[85px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/20 blur-[85px]"
          aria-hidden="true"
        />

        {/* টপ কন্ট্রোল বার */}
        <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3 sm:px-7">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-bold tracking-wide text-slate-200">
              ডেভফোরজ কমিউনিটি
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? 'টাইমার চালু করুন' : 'টাইমার সাময়িক বন্ধ করুন'}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-amber-300">থামানো আছে</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-violet-300" />
                  <span>{displaySeconds} সেকেন্ডে বন্ধ হবে</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={closeModal}
              aria-label="মডাল বন্ধ করুন"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:rotate-90 hover:bg-rose-500/20 hover:text-rose-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* মূল লেআউট */}
        <div className="relative z-10 grid grid-cols-1 items-center gap-6 px-5 py-5 sm:px-8 sm:py-6 md:grid-cols-12 md:gap-7">
          {/* বাম পাশ: কন্টেন্ট ও অপশন */}
          <div className="order-2 md:order-1 md:col-span-7">
            <div className="df-stagger-1 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">
              {/* <Sparkles className="h-3.5 w-3.5 text-amber-300" /> */}
              <span>প্রতিষ্ঠাতার শুভেচ্ছা বার্তা</span>
            </div>

            <h2
              id="welcome-title"
              className="df-stagger-2 mt-2.5 text-2xl font-bold leading-[1.2] text-white sm:text-[1.85rem]"
            >
              একসাথে শিখুন, গড়ুন এবং এগিয়ে যান{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                ডেভফোরজ-এ!
              </span>
            </h2>

            {/* কোট বক্স */}
            <div className="df-stagger-3 mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-start gap-2.5">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <p className="text-sm leading-[1.6] text-slate-200">
                  ডেভফোরজ-এ আপনাকে স্বাগতম। আমরা এমন একটি প্ল্যাটফর্ম গড়ে তুলতে
                  চেয়েছি যেখানে আগ্রহী ডেভেলপাররা বাস্তব সমস্যার সমাধান করবে,
                  জ্ঞান ভাগ করে নেবে এবং একে অপরের সহযোগিতায় দক্ষ হয়ে উঠবে।
                </p>
              </div>
            </div>

            {/* লক্ষ্য বাছাই */}
            <div className="df-stagger-3 mt-3.5">
              <p className="mb-2 text-xs font-semibold text-slate-400">
                আজ আপনি কোন বিষয়টি দিয়ে শুরু করতে চান?
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map(({ id, label, icon: Icon }) => {
                  const active = selectedInterest === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedInterest(id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                        active
                          ? 'border-violet-400 bg-violet-500/25 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          active ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      />
                      <span>{label}</span>
                      {active && (
                        <CheckCircle2 className="ml-0.5 h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA বাটন */}
            <div className="df-stagger-4 mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3.5">
              <button
                ref={ctaRef}
                type="button"
                onClick={handleExplore}
                className="df-btn-shimmer group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_-5px_rgba(139,92,246,0.55)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
              >
                <span>ডেভফোরজ ঘুরে দেখুন</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <span className="text-center text-xs text-slate-400 sm:text-left">
                কার্ডে মাউস রাখলে টাইমার পজ হবে
              </span>
            </div>
          </div>

          {/* ডান পাশ: মাস্কড ইমেজ ও ফাউন্ডার কার্ড */}
          <div className="df-stagger-2 order-1 flex flex-col items-center justify-center md:order-2 md:col-span-5">
            <div className="relative flex items-center justify-center pb-3">
              {/* ঘূর্ণায়মান রিং */}
              <svg
                viewBox="0 0 200 200"
                className="df-orbit pointer-events-none absolute -inset-5 h-[calc(100%+2.5rem)] w-[calc(100%+2.5rem)] opacity-45"
                aria-hidden="true"
              >
                <defs>
                  <path
                    id="bnCircleTextPath"
                    d="M 100, 100 m -82, 0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0"
                  />
                </defs>
                <text
                  fill="#c4b5fd"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="3.2"
                >
                  <textPath href="#bnCircleTextPath">
                    গড়ুন • শিখুন • সহযোগিতা করুন •
                  </textPath>
                </text>
              </svg>

              {/* গ্লোয়িং ব্যাকড্রপ */}
              <div
                style={{ clipPath: 'url(#devforge-arch-mask-bn)' }}
                className="df-pulse-ring absolute -inset-1.5 bg-gradient-to-tr from-violet-500 via-fuchsia-400 to-amber-300 opacity-60 blur-sm"
                aria-hidden="true"
              />

              {/* মাস্কড পোর্ট্রেট */}
              <div
                style={{ clipPath: 'url(#devforge-arch-mask-bn)' }}
                className="relative h-48 w-44 bg-gradient-to-b from-violet-500/30 to-slate-800 p-1 sm:h-56 sm:w-52"
              >
                <div
                  style={{ clipPath: 'url(#devforge-arch-mask-bn)' }}
                  className="relative h-full w-full overflow-hidden bg-slate-800"
                >
                  <img
                    src="/images/zubayer-profile.webp"
                    alt="জুবায়ের হোসেন - সিইও, ডেভফোরজ"
                    fetchPriority="high"
                    className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                </div>
              </div>

              {/* ফাউন্ডার পরিচিতি কার্ড */}
              <div className="absolute -bottom-1 z-20 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-slate-900/95 px-3.5 py-2 shadow-xl backdrop-blur-md">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 text-xs font-bold text-slate-950">
                  জুবু
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold leading-snug text-white">
                    জুবায়ের হোসেন
                  </p>
                  <p className="text-[11px] font-medium text-amber-300">
                    প্রতিষ্ঠাতা ও সিইও, ডেভফোরজ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* বটম প্রোগ্রেস বার */}
        <div className="relative h-1.5 w-full overflow-hidden bg-white/10">
          <div
            style={{ width: `${progressPercentage}%` }}
            className={`h-full transition-all duration-100 ease-linear ${
              isPaused
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-300'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
