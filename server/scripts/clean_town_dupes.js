const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Specific redundant duplicates identified
const redundantPairs = [
  // { keep: 'somanathapura_keshava_temple', drop: ['somanathapura', 'temple_somanathapura'] },
  { keep: 'srirangapatna_fort_dariya_daulat', drop: ['srirangapatna'] },
  { keep: 'somanathapura_keshava_temple', drop: ['somanathapura', 'temple_somanathapura'] },
  { keep: 'melukote_cheluvanarayana_kalyani', drop: ['temple_melukote'] },
  { keep: 'temple_talakadu', drop: ['talakadu'] },
  { keep: 'shravanabelagola_bahubali', drop: ['shravanabelagola'] },
  { keep: 'channapatna_toy_craft_village', drop: ['heritage_channapatna_toys'] },
  { keep: 'namdroling_golden_temple_bylakuppe', drop: ['temple_golden_temple_bylakuppe'] },
  { keep: 'chamundi_hills_nandi', drop: ['chamundi'] },
  { keep: 'shivanasamudra_falls_twin', drop: ['shivanasamudra'] },
  { keep: 'bandipur_tiger_reserve', drop: ['bandipur'] },
  { keep: 'br_hills_biligiri_ranganatha', drop: ['biligiri_rangana'] },
  { keep: 'badami_cave_temples', drop: ['badami'] },
  { keep: 'aihole_durga_temple_complex', drop: ['aihole'] },
  { keep: 'pattadakal_unesco_temples', drop: ['pattadakal'] },
  { keep: 'dandeli_wildlife_kali_rafting', drop: ['dandeli'] },
  { keep: 'kudremukh_peak_national_park', drop: ['kudremukh'] },
  { keep: 'mullayanagiri_highest_peak', drop: ['mullayanagiri'] },
  { keep: 'murudeshwar_shiva_temple_beach', drop: ['murudeshwar'] },
  { keep: 'hebbe_falls_kemmangundi', drop: ['hebbe_falls'] },
  { keep: 'abbey_falls_madikeri', drop: ['abbey_falls'] },
  { keep: 'iruppu_falls_brahmagiri', drop: ['iruppu_falls'] },
  { keep: 'hampi_virupaksha_vijaya_vittala', drop: ['hampi'] }
];

async function cleanTownDuplicates() {
  const { data: allDest } = await supabase.from('destinations').select('id, name');
  const existingIds = new Set((allDest || []).map(d => d.id));

  const toDrop = [];
  redundantPairs.forEach(pair => {
    // Check if both keep and any drop exist
    const keepExists = existingIds.has(pair.keep);
    pair.drop.forEach(dropId => {
      if (existingIds.has(dropId)) {
        if (keepExists) {
          toDrop.push(dropId);
          console.log(`Drop redundant [${dropId}], keeping rich entry [${pair.keep}]`);
        } else {
          // If the keep ID didn't exist, we keep the dropId instead of deleting it!
          console.log(`Note: ${pair.keep} not in DB, retaining ${dropId}`);
        }
      }
    });
  });

  console.log(`\nDeleting ${toDrop.length} town/monument redundant duplicates...`);
  for (const id of toDrop) {
    await supabase.from('destination_categories').delete().eq('destination_id', id);
    await supabase.from('destinations').delete().eq('id', id);
  }

  // Update local places.json
  const placesFile = path.join(__dirname, '..', 'data', 'places.json');
  if (fs.existsSync(placesFile)) {
    let local = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
    const dropSet = new Set(toDrop);
    local = local.filter(p => !dropSet.has(p.id));
    fs.writeFileSync(placesFile, JSON.stringify(local, null, 2), 'utf8');
    console.log(`✓ places.json cleaned. Remaining: ${local.length}`);
  }

  const { count } = await supabase.from('destinations').select('*', { count: 'exact', head: true });
  console.log(`\nFinal unique destinations in Supabase: ${count}`);
}

cleanTownDuplicates();

