import React from 'react';
import { useApp } from '../AppContext';
import { TOURISM_NEWS_ARTICLES } from '../data/tourismModulesData';
import { Newspaper, Calendar, MapPin, ExternalLink, ShieldCheck, Tag } from 'lucide-react';

export default function NewsPage() {
  const { lang } = useApp();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            <Newspaper size={16} />
            <span>{lang === 'kn' ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಸಮಾಚಾರ' : 'Official Press & Intelligence'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-white">
            {lang === 'kn' ? 'ಇತ್ತೀಚಿನ ಪ್ರವಾಸೋದ್ಯಮ ಸುದ್ದಿ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು' : 'Latest Tourism News & Advisories'}
          </h1>
          <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            {lang === 'kn'
              ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಇಲಾಖೆ, ಕೆಎಸ್‌ಟಿಡಿಸಿ, ಮತ್ತು ಅರಣ್ಯ ಇಲಾಖೆಯಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ನೈಜ ಪ್ರಕಟಣೆಗಳು ಮತ್ತು ಸಾರಿಗೆ ಸುಧಾರಣೆಗಳು.'
              : 'Verified press updates, infrastructure projects, safari quota modifications, and travel advisories directly from Karnataka government authorities.'}
          </p>
        </div>

        {/* News Cards Grid */}
        <div className="space-y-6">
          {TOURISM_NEWS_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-stone-800/90 rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-700/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60">
                    {article.category}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium">
                    <Calendar size={13} /> {article.date || article.publishedDate}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium">
                    <MapPin size={13} /> {article.district}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white leading-snug">
                  {lang === 'kn' ? (article.titleKannada || article.headlineKannada || article.title) : (article.title || article.headline)}
                </h2>

                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {lang === 'kn' ? (article.summaryKannada || article.summary) : article.summary}
                </p>

                <div className="text-xs text-stone-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'kn' ? 'ಮಾಹಿತಿ ಮೂಲ:' : 'Verified Source:'} <strong className="text-stone-700 dark:text-stone-300">{article.source}</strong></span>
                </div>
              </div>

              <div className="shrink-0 pt-2 md:pt-0">
                <a
                  href={article.url || article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-700 hover:bg-emerald-800 hover:text-white dark:hover:bg-emerald-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors shadow-2xs"
                >
                  <span>{lang === 'kn' ? 'ಮೂಲ ವರದಿ ಓದಿ' : 'Read Official Press'}</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

