const { GoogleGenerativeAI } = require('@google/generative-ai');
const places = require('../data/places.json');

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
].filter(Boolean);

function hasKey() {
  const key = process.env.GEMINI_API_KEY;
  return !!(key && key.trim().length > 0 && !key.includes('your_api_key') && !key.startsWith('sk-'));
}

function cleanJsonResponse(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  // Strip markdown code fences like ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

async function executeWithFallback(taskFn) {
  let lastError = null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' }
      });
      return await taskFn(model, modelName);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Model ${modelName} call failed: ${err.message}. Trying next candidate...`);
    }
  }
  throw lastError || new Error('All Gemini model candidates failed');
}

async function arrangeWithAI(input, shortlistedIds) {
  if (!hasKey()) throw new Error('GEMINI_API_KEY is not configured');

  const placeMap = Object.fromEntries(places.map(p => [p.id, p]));
  let targetPlace = input.targetPlaceId ? placeMap[input.targetPlaceId] : null;

  let candidateIds = [...shortlistedIds];
  if (targetPlace && !candidateIds.includes(targetPlace.id)) {
    candidateIds.unshift(targetPlace.id);
  }

  // If a target place is chosen, prioritize surrounding attractions in same district/region
  if (targetPlace) {
    const sameDistrict = places.filter(p => 
      p.id !== targetPlace.id && 
      p.district && 
      p.district.toLowerCase() === (targetPlace.district || '').toLowerCase()
    ).map(p => p.id);
    candidateIds = Array.from(new Set([targetPlace.id, ...sameDistrict, ...candidateIds]));
  }

  const shortlisted = candidateIds.map(id => placeMap[id]).filter(Boolean);

  const prompt = `You are a certified Karnataka Tourism and AI Trip Architecture Specialist.
Arrange these verified places into an authentic, geographically coherent ${input.days}-day itinerary.

Structured Travel Parameters:
- Starting City: ${input.startCity}
- Trip Duration: ${input.days} days
- Number of Travellers: ${input.travellers || 2}
- Pace: ${input.pace || 'Balanced'}
- Group Type: ${input.groupType || 'Couple'}
- Travel Mode: ${input.travelMode || 'Personal car'}
- Target Budget: ₹${input.budget || 25000}
- Travel Month: ${input.month || 'Current'}
- User Interests: ${(input.interests || []).join(', ')}
${targetPlace ? `- SELECTED PRIMARY ANCHOR DESTINATION:
  * Destination ID: "${targetPlace.id}"
  * Destination Name: "${targetPlace.name}"
  * District: "${targetPlace.district}"
  * Coordinates: [${targetPlace.lat}, ${targetPlace.lng}]
  * MANDATORY REQUIREMENT: "${targetPlace.name}" MUST be featured prominently as the core destination on Day 1.` : ''}

Available verified Karnataka destinations to select from (use ONLY these exact placeId values):
${JSON.stringify(shortlisted.map(p => ({
  id: p.id,
  name: p.name,
  district: p.district,
  region: p.region,
  category: p.category,
  avgVisitHours: p.avgVisitHours,
  entryFeeINR: p.entryFeeINR,
  nearbyFood: p.nearbyFood
})))}

Output Format Requirements:
Return strictly a valid JSON object matching this schema:
{
  "days": [
    {
      "day": 1,
      "title": "Day 1 Title / Theme",
      "region": "Region name",
      "stayArea": "Overnight stay town/area",
      "stops": [
        {
          "placeId": "exact_place_id",
          "description": "Engaging, verified historical/cultural description for this stop",
          "tip": "Practical insider tip for visitors",
          "food": ["Authentic local specialty dishes nearby"]
        }
      ]
    }
  ]
}

Strict Architectural Rules:
1. Every placeId MUST strictly match one of the exact IDs provided in the list.
2. Structure days geographically to eliminate backtracking and excessive driving.
3. NEVER repeat the same tourist attraction on multiple days.
4. Keep stops realistic for ${input.pace || 'Balanced'} pace (2-4 stops per day).
5. Output ONLY valid JSON, with no surrounding explanations or non-JSON markdown text.`;

  return await executeWithFallback(async (model, modelName) => {
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const json = cleanJsonResponse(text);

    if (!json || !Array.isArray(json.days)) {
      throw new Error('Malformed itinerary response structure from Gemini');
    }

    // Filter out invalid place IDs and eliminate duplicate stops across days
    const validIds = new Set(places.map(p => p.id));
    const seenStops = new Set();

    for (const d of json.days) {
      d.stops = (d.stops || []).filter(s => {
        if (!s || !s.placeId || !validIds.has(s.placeId)) return false;
        if (seenStops.has(s.placeId)) return false; // Prevent duplicates
        seenStops.add(s.placeId);
        return true;
      });
    }

    // Ensure target destination is present if specified
    if (targetPlace && !seenStops.has(targetPlace.id) && json.days.length > 0) {
      json.days[0].stops.unshift({
        placeId: targetPlace.id,
        description: targetPlace.description,
        tip: 'Primary selected destination',
        food: targetPlace.nearbyFood || []
      });
    }

    console.log(`[Gemini] Successfully generated plan with model: ${modelName}`);
    return json;
  });
}

async function chatWithAI(message, plan) {
  if (!hasKey()) return null;

  const prompt = `You are a Karnataka travel planning assistant. Modify the following trip plan based on the user's request.
User request: "${message}"

Current plan:
${JSON.stringify(plan)}

Allowed dataset place IDs:
${places.map(p => p.id).join(', ')}

Instructions:
1. Modify the itinerary days and stops in accordance with the user request.
2. Only reference valid placeId values from the provided dataset IDs list.
3. Return the full updated plan object in the exact same JSON format.
4. Output strictly JSON.`;

  return await executeWithFallback(async (model, modelName) => {
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const updatedPlan = cleanJsonResponse(text);
    console.log(`[Gemini Chat] Successfully updated plan with model: ${modelName}`);
    return updatedPlan;
  });
}

async function testGeminiConnection() {
  if (!hasKey()) {
    return { ok: false, error: 'GEMINI_API_KEY is not configured in server/.env' };
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    const model = genAI.getGenerativeModel({ model: CANDIDATE_MODELS[0] });
    const result = await model.generateContent('Reply with the word "Pravasa" only.');
    const reply = result.response.text().trim();
    return { ok: true, model: CANDIDATE_MODELS[0], reply };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { hasKey, arrangeWithAI, chatWithAI, testGeminiConnection };
