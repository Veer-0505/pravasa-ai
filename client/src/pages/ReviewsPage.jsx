import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Star, ThumbsUp, MessageSquare, Plus, ShieldCheck, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReviewsPage() {
  const { lang, user, showToast } = useApp();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRating, setFilterRating] = useState('all');

  // Form state
  const [formPlace, setFormPlace] = useState('hampi');
  const [formName, setFormName] = useState(user?.name || '');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    fetch('/api/reviews?status=approved')
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleHelpful = async (id) => {
    try {
      const res = await fetch(`/api/reviews/${id}/helpful`, { method: 'POST' });
      if (res.ok) {
        showToast(lang === 'kn' ? 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ದಾಖಲಾಗಿದೆ.' : 'Thank you for your helpful vote!');
        fetchReviews();
      }
    } catch {
      // ignore
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formContent.trim() || !formTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: formPlace,
          userName: formName || 'Karnataka Explorer',
          title: formTitle,
          content: formContent,
          rating: Number(formRating),
          travelType: 'Family / Leisure'
        })
      });

      if (res.ok) {
        showToast(lang === 'kn' ? 'ವಿಮರ್ಶೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!' : 'Review submitted successfully!');
        setShowModal(false);
        setFormTitle('');
        setFormContent('');
        fetchReviews();
      }
    } catch {
      showToast('Error submitting review');
    }
    setSubmitting(false);
  };

  const filtered = filterRating === 'all'
    ? reviews
    : reviews.filter(r => r.rating === Number(filterRating));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
              <Star size={16} />
              <span>{lang === 'kn' ? 'ಪ್ರವಾಸಿಗರ ಸಮುದಾಯ ಮತ್ತು ಅಭಿಪ್ರಾಯ' : 'Traveler Community Intelligence'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-white">
              {lang === 'kn' ? 'ವಿಮರ್ಶೆಗಳು ಮತ್ತು ಅನುಭವಗಳು' : 'Visitor Reviews & Experiences'}
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base max-w-xl mt-2">
              {lang === 'kn'
                ? 'ಕರ್ನಾಟಕದ ಪ್ರವಾಸಿ ತಾಣಗಳ ಬಗ್ಗೆ ನೈಜ ಪ್ರಯಾಣಿಕರ ಅನುಭವಗಳು, ಸಲಹೆಗಳು ಮತ್ತು ರೇಟಿಂಗ್‌ಗಳು.'
                : 'Real reviews, tips, cleanliness observations, and verified guide feedback across Karnataka.'}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <Plus size={16} />
            <span>{lang === 'kn' ? 'ವಿಮರ್ಶೆ ಬರೆಯಿರಿ' : 'Write a Review'}</span>
          </button>
        </div>

        {/* Rating Overview Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl sm:text-5xl font-black font-serif text-emerald-800 dark:text-emerald-400">
              {avgRating}
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#f59e0b" stroke="none" />
                ))}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {reviews.length} {lang === 'kn' ? 'ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ವಿಮರ್ಶೆಗಳು' : 'verified traveler reviews'}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-1">
              {lang === 'kn' ? 'ರೇಟಿಂಗ್ ಫಿಲ್ಟರ್:' : 'Filter:'}
            </span>
            {['all', '5', '4', '3'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filterRating === r
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {r === 'all' ? (lang === 'kn' ? 'ಎಲ್ಲಾ' : 'All') : `${r} ★`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-16 text-stone-400">
            {lang === 'kn' ? 'ವಿಮರ್ಶೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading traveler reviews...'}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(rev => (
              <div
                key={rev.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>{rev.userName}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">
                            ✓ {lang === 'kn' ? 'ದೃಢೀಕೃತ ಪ್ರವಾಸಿ' : 'Verified'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {rev.visitedMonth ? `${rev.visitedMonth} • ` : ''}
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" stroke="none" />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white mb-2">
                    {rev.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                    {rev.content}
                  </p>
                </div>

                {/* Helpful Button */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    📍 {rev.placeId?.toUpperCase()}
                  </span>

                  <button
                    onClick={() => handleHelpful(rev.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    <ThumbsUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'kn' ? 'ಉಪಯುಕ್ತ' : 'Helpful'} ({rev.helpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-stone-500">
            {lang === 'kn' ? 'ಯಾವುದೇ ವಿಮರ್ಶೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No reviews match your filter.'}
          </div>
        )}

        {/* Review Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರವಾಸ ವಿಮರ್ಶೆ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Your Travel Experience'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">✕</button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                    {lang === 'kn' ? 'ತಾಣ:' : 'Destination:'}
                  </label>
                  <select
                    value={formPlace}
                    onChange={e => setFormPlace(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="hampi">Hampi (ವಿಜಯನಗರ)</option>
                    <option value="coorg_abbey_falls">Coorg Abbey Falls (ಕೊಡಗು)</option>
                    <option value="mysuru_palace">Mysuru Palace (ಮೈಸೂರು)</option>
                    <option value="gokarna_beach">Gokarna Om Beach (ಗೋಕರ್ಣ)</option>
                    <option value="jog_falls">Jog Falls (ಶಿವಮೊಗ್ಗ)</option>
                    <option value="badami">Badami Caves (ಬಾಗಲಕೋಟೆ)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                      {lang === 'kn' ? 'ನಿಮ್ಮ ಹೆಸರು:' : 'Your Name:'}
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Ramesh / Deepa"
                      className="input text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                      {lang === 'kn' ? 'ರೇಟಿಂಗ್:' : 'Rating:'}
                    </label>
                    <select
                      value={formRating}
                      onChange={e => setFormRating(e.target.value)}
                      className="input text-xs"
                    >
                      <option value="5">5 ★★★★★ (Exceptional)</option>
                      <option value="4">4 ★★★★☆ (Good)</option>
                      <option value="3">3 ★★★☆☆ (Average)</option>
                      <option value="2">2 ★★☆☆☆ (Poor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                    {lang === 'kn' ? 'ಶೀರ್ಷಿಕೆ:' : 'Review Title:'}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Majestic sunset and peaceful atmosphere"
                    className="input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                    {lang === 'kn' ? 'ನಿಮ್ಮ ವಿವರವಾದ ಅನುಭವ & ಸಲಹೆ:' : 'Your Review & Practical Tips:'}
                  </label>
                  <textarea
                    rows={4}
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    placeholder="Mention entry timings, cleanliness, best guide contacts, or food recommendations..."
                    className="input text-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline btn-sm"
                  >
                    {lang === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary btn-sm bg-emerald-800"
                  >
                    {submitting ? '...' : (lang === 'kn' ? 'ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಿ' : 'Submit Review')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

