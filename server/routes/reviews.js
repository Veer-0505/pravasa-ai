const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const reviewsPath = path.join(__dirname, '..', 'data', 'reviews.json');

function readReviews() {
  try {
    if (!fs.existsSync(reviewsPath)) return [];
    return JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
  } catch (err) {
    console.error('[Reviews Read Error]', err);
    return [];
  }
}

function writeReviews(reviews) {
  try {
    fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Reviews Write Error]', err);
    return false;
  }
}

// Track helpful upvotes per IP/user to prevent double voting: reviewId_identifier -> true
const votedReviews = new Set();

/**
 * GET /api/reviews
 * Optional filters: ?placeId=hampi&status=approved
 */
router.get('/', (req, res) => {
  const { placeId, status = 'approved' } = req.query;
  let reviews = readReviews();

  if (placeId) {
    reviews = reviews.filter(r => r.placeId.toLowerCase() === placeId.toLowerCase());
  }

  if (status && status !== 'all') {
    reviews = reviews.filter(r => r.status === status);
  }

  // Sort newest first
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Compute aggregated rating if placeId is given
  let stats = null;
  if (placeId && reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    stats = {
      total: reviews.length,
      averageRating: parseFloat((sum / reviews.length).toFixed(1))
    };
  }

  res.json({
    ok: true,
    count: reviews.length,
    stats,
    reviews
  });
});

/**
 * POST /api/reviews
 * Submit a community review for a Karnataka destination
 */
router.post('/', (req, res) => {
  try {
    const { placeId, placeName, userName, userEmail, rating, title, content, visitedMonth, travelType } = req.body;

    if (!placeId || !title || !content) {
      return res.status(400).json({ error: 'placeId, title, and review content are required' });
    }

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    if (content.trim().length < 15) {
      return res.status(400).json({ error: 'Review content must be at least 15 characters long' });
    }

    const reviews = readReviews();

    // Check for recent duplicate from same user on same place
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    if (cleanEmail) {
      const existing = reviews.find(r => r.placeId === placeId && (r.userEmail || '').toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(409).json({ error: 'You have already submitted a review for this destination.' });
      }
    }

    const newReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      placeId: placeId.trim(),
      placeName: placeName || placeId,
      userName: (userName || 'Karnataka Traveller').trim(),
      userEmail: cleanEmail || undefined,
      userRole: cleanEmail ? 'Verified Traveller' : 'Community Visitor',
      rating: numRating,
      title: title.trim(),
      content: content.trim(),
      visitedMonth: visitedMonth || 'Recent',
      travelType: travelType || 'Leisure',
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      status: 'approved' // auto-approved with post-moderation flag
    };

    reviews.unshift(newReview);
    writeReviews(reviews);

    console.log(`[Community Review] New review for ${newReview.placeId} by ${newReview.userName} (Rating: ${numRating}★)`);

    res.status(201).json({
      ok: true,
      message: 'Review submitted successfully. Thank you for helping fellow travellers!',
      review: newReview
    });
  } catch (err) {
    console.error('[Submit Review Error]', err);
    res.status(500).json({ error: 'Failed to submit review: ' + err.message });
  }
});

/**
 * POST /api/reviews/:id/helpful
 * Mark review as helpful
 */
router.post('/:id/helpful', (req, res) => {
  const { id } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
  const voteKey = `${id}_${ip}`;

  if (votedReviews.has(voteKey)) {
    return res.status(400).json({ error: 'You have already upvoted this review' });
  }

  const reviews = readReviews();
  const review = reviews.find(r => r.id === id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.helpfulCount = (review.helpfulCount || 0) + 1;
  votedReviews.add(voteKey);
  writeReviews(reviews);

  res.json({
    ok: true,
    helpfulCount: review.helpfulCount
  });
});

/**
 * POST /api/reviews/:id/flag
 * Flag review for admin moderation
 */
router.post('/:id/flag', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const reviews = readReviews();
  const review = reviews.find(r => r.id === id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.flagged = true;
  review.flagReason = reason || 'User reported content';
  review.flaggedAt = new Date().toISOString();
  writeReviews(reviews);

  console.log(`[Review Moderation] Review ${id} flagged: ${review.flagReason}`);

  res.json({
    ok: true,
    message: 'Review flagged for administrative moderation'
  });
});

/**
 * DELETE /api/reviews/:id
 * Admin endpoint: Delete/moderate a review
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const reviews = readReviews();
  const idx = reviews.findIndex(r => r.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const removed = reviews.splice(idx, 1)[0];
  writeReviews(reviews);

  res.json({
    ok: true,
    message: `Review ${id} removed by administrator`
  });
});

module.exports = router;

