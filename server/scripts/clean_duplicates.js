const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const toRemove = [
  "gol_gumbaz_bijapur",
  "belur_chennakeshava_temple",
  "jog_falls_sharavathi",
  "gokarna_om_beach_mahabaleshwar",
  "st_marys_island_malpe",
  "temple_kukke_subramanya",
  "nandi_hills_nandidurga",
  "chitradurga_fort_elusuttina_kote",
  "ballari_fort_upper_lower",
  "kittur_chennamma_fort",
  "gokak_falls_hanging_bridge",
  "ghati_subramanya_temple",
  "devanahalli_fort_tipu_birthplace",
  "heritage_mahmud_gawan",
  "gurudwara_nanak_jhira",
  "harihareshwara_temple_harihar",
  "chandramouleshwara_temple_unkal",
  "khwaja_bande_nawaz_dargah",
  "tarakeshwara_temple_hangal",
  "kotilingeshwara_temple",
  "itagi_mahadeva_temple",
  "anjanadri_hill_kishkindha",
  "raichur_fort_kakatiya",
  "mantralayam_brindavan",
  "madhugiri_monolithic_fort",
  "mirjan_fort_kumta",
  "heritage_ibrahim_rauza",
  "heritage_bara_kaman",
  "yadgir_hill_fort",
  "mysuru_palace_amba_vilas"
];

async function deduplicate() {
  console.log(`Starting cleanup of ${toRemove.length} duplicate destinations...`);

  // 1. Delete duplicates from Supabase
  for (const id of toRemove) {
    const { error: catErr } = await supabase.from('destination_categories').delete().eq('destination_id', id);
    const { error: destErr } = await supabase.from('destinations').delete().eq('id', id);
    if (destErr) {
      console.error(`Failed to delete ${id} from Supabase:`, destErr.message);
    } else {
      console.log(`✓ Deleted duplicate ${id} from Supabase`);
    }
  }

  // 2. Also remove dist_ and taluk_ wrapper records from destinations in Supabase so only real tourist attractions remain
  const { data: wrappers } = await supabase.from('destinations').select('id, place_type');
  const wrapperIds = (wrappers || [])
    .filter(d => d.place_type === 'district' || d.place_type === 'taluk' || d.id.startsWith('dist_') || d.id.startsWith('taluk_'))
    .map(d => d.id);

  console.log(`Found ${wrapperIds.length} administrative district/taluk wrappers in destinations table...`);
  for (const wId of wrapperIds) {
    await supabase.from('destination_categories').delete().eq('destination_id', wId);
    await supabase.from('destinations').delete().eq('id', wId);
  }
  console.log(`✓ Removed administrative wrappers from tourist destinations table.`);

  // 3. Clean up local places.json as well
  const placesFile = path.join(__dirname, '..', 'data', 'places.json');
  if (fs.existsSync(placesFile)) {
    let localPlaces = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
    const allRemoved = new Set([...toRemove, ...wrapperIds]);
    localPlaces = localPlaces.filter(p => !allRemoved.has(p.id));
    fs.writeFileSync(placesFile, JSON.stringify(localPlaces, null, 2), 'utf8');
    console.log(`✓ Cleaned local places.json. Remaining verified attractions: ${localPlaces.length}`);
  }

  // 4. Verify count in Supabase
  const { count } = await supabase.from('destinations').select('*', { count: 'exact', head: true });
  console.log(`\nFinal unique verified destinations in Supabase: ${count}`);
}

deduplicate();

