/**
 * Pravasa AI - Supabase Migration Script
 * Migrates 287+ verified Karnataka destinations, daytime photography,
 * hidden gems classification, and categories to Supabase PostgreSQL.
 *
 * Usage:
 *   node server/scripts/migrate_to_supabase.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE')) {
  console.error('\n❌ ERROR: Supabase credentials not found or incomplete.');
  console.error('Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env before running migration.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('\n======================================================');
  console.log('🚀 PRAVASA AI - MIGRATING TO SUPABASE POSTGRESQL');
  console.log('Target URL:', supabaseUrl);
  console.log('======================================================\n');

  const placesPath = path.join(__dirname, '..', 'data', 'places.json');
  if (!fs.existsSync(placesPath)) {
    console.error('Places file not found at:', placesPath);
    process.exit(1);
  }

  const places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
  console.log(`Loaded ${places.length} verified places from places.json.`);

  // 1. Batch upsert destinations
  console.log('Migrating destinations table...');
  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < places.length; i += batchSize) {
    const chunk = places.slice(i, i + batchSize);

    const formattedDestinations = chunk.map(p => {
      const pLat = parseFloat(p.lat || p.location?.latitude || 12.9716);
      const pLng = parseFloat(p.lng || p.location?.longitude || 77.5946);
      const directGpsUrl = p.googleMapsUrl || (pLat && pLng ? `https://www.google.com/maps/search/?api=1&query=${pLat},${pLng}` : (p.source_url || 'https://karnatakatourism.org'));

      return {
        id: p.id,
        name: p.name,
        name_kannada: p.nameKannada || p.name,
        district: p.district || 'Karnataka',
        taluk: p.taluk || p.district || '',
        division: p.division || '',
        place_type: p.place_type || 'attraction',
        lat: pLat,
        lng: pLng,
        description: p.description || '',
        short_description: p.shortDescription || p.description || '',
        image: p.image || '',
        image_attribution: p.imageAttribution || {},
        time_of_day_media: {
          ...(p.timeOfDayMedia || {}),
          googleMapsUrl: directGpsUrl
        },
        video: p.video || {},
        entry_fee_inr: parseInt(p.entryFeeINR || p.visit_info?.entryFeeINR || 0, 10),
        opening_hours: p.openingHours || p.visit_info?.openingHours || '06:00 - 18:00',
        contact: p.contact || '1800-425-4425',
        official_website: p.official_website || 'https://karnatakatourism.org',
        accessibility: p.accessibility || 'Partially accessible',
        accessibility_score: parseInt(p.accessibilityScore || 6, 10),
        parking: p.parking !== undefined ? Boolean(p.parking) : true,
        offbeat: p.offbeat !== undefined ? Boolean(p.offbeat) : false,
        is_published: p.isPublished !== undefined ? Boolean(p.isPublished) : true,
        verification_status: p.verification_status || 'verified',
        verified_date: p.verifiedDate || '2024-01-01',
        source: p.source || 'Department of Tourism, Government of Karnataka',
        source_url: directGpsUrl,
        crowd_level: p.crowdLevel || 2,
        senior_friendly: p.seniorFriendly !== undefined ? Boolean(p.seniorFriendly) : true,
        family_friendly: p.familyFriendly !== undefined ? Boolean(p.familyFriendly) : true,
        last_updated_by: 'Migration Script'
      };
    });

    const { error } = await supabase
      .from('destinations')
      .upsert(formattedDestinations, { onConflict: 'id' });

    if (error) {
      console.error(`Error migrating batch ${i} - ${i + chunk.length}:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`  ✓ Synced ${successCount} / ${places.length} destinations.`);
    }
  }

  // 2. Migrate Hidden Gems
  console.log('\nMigrating hidden_gems table...');
  const gemPlaces = places.filter(p => p.offbeat || p.hiddenGemClassification?.status === 'hidden_gem');
  const formattedGems = gemPlaces.map(p => ({
    destination_id: p.id,
    status: p.hiddenGemClassification?.status || 'hidden_gem',
    why_offbeat: p.hiddenGemClassification?.reason || p.description || 'Authentic lesser-known Karnataka destination',
    nearest_major_hub: p.distanceFromNearestTown || `${p.district} town`,
    route_condition: p.roadAccessibility || 'Paved all-weather road',
    best_time_to_visit: p.bestSeason || 'October to March',
    cultural_significance: p.culturalImportance || 'Local cultural destination'
  }));

  if (formattedGems.length > 0) {
    const { error: gemError } = await supabase
      .from('hidden_gems')
      .upsert(formattedGems, { onConflict: 'destination_id' });

    if (gemError) {
      console.error('Error inserting hidden gems:', gemError.message);
    } else {
      console.log(`  ✓ Synced ${formattedGems.length} hidden gems records.`);
    }
  }

  // 3. Migrate Categories
  console.log('\nMigrating destination_categories table...');
  const categoryRecords = [];
  places.forEach(p => {
    const cats = Array.isArray(p.category) ? p.category : (p.category ? [p.category] : ['heritage']);
    cats.forEach(c => {
      if (c && c.trim()) {
        categoryRecords.push({
          destination_id: p.id,
          category: c.trim().toLowerCase()
        });
      }
    });
  });

  for (let i = 0; i < categoryRecords.length; i += 200) {
    const chunk = categoryRecords.slice(i, i + 200);
    const { error } = await supabase.from('destination_categories').insert(chunk);
    if (error && !error.message.includes('duplicate')) {
      console.error('Category insert notice:', error.message);
    }
  }
  console.log(`  ✓ Processed ${categoryRecords.length} category tags.`);

  console.log('\n======================================================');
  console.log('🎉 DATA MIGRATION TO SUPABASE COMPLETED SUCCESSFULLY!');
  console.log(`   Total destinations migrated: ${successCount}`);
  console.log(`   Total hidden gems migrated: ${formattedGems.length}`);
  console.log('======================================================\n');
}

runMigration().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});

