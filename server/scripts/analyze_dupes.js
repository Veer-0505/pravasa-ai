const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function cleanName(n) {
  return (n || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\b(temple|fort|falls|waterfall|hill|hills|national|park|sanctuary|palace|heritage|island|caves|cave|monastery|lake|dam|beach)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function analyze() {
  const { data } = await supabase.from('destinations').select('*');
  
  // Find duplicate pairs
  const groups = {};
  data.forEach(d => {
    if (d.place_type === 'district' || d.place_type === 'taluk' || d.id.startsWith('dist_') || d.id.startsWith('taluk_')) return;
    const c = cleanName(d.name);
    if (!c || c.length < 3) return;
    const key = `${c}__${(d.district || '').toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  const duplicates = Object.entries(groups).filter(([k, list]) => list.length > 1);
  console.log(`Found ${duplicates.length} duplicate groups to resolve:\n`);

  const toDelete = [];
  duplicates.forEach(([k, list]) => {
    console.log(`Group: ${k}`);
    // Pick the best one to keep:
    // If one has a custom Supabase image (starts with https://...supabase.co), definitely keep it!
    // Otherwise keep the one with shorter/cleaner standard ID or more description
    let keep = list[0];
    let drop = list[1];

    if (list[1].image && list[1].image.includes('supabase.co')) {
      keep = list[1];
      drop = list[0];
    } else if (list[0].image && list[0].image.includes('supabase.co')) {
      keep = list[0];
      drop = list[1];
    } else if (list[0].id.length <= list[1].id.length) {
      keep = list[0];
      drop = list[1];
    } else {
      keep = list[1];
      drop = list[0];
    }

    console.log(`   KEEP: [${keep.id}] "${keep.name}" (img: ${keep.image?.substring(0, 40)}...)`);
    console.log(`   DROP: [${drop.id}] "${drop.name}"\n`);
    toDelete.push(drop.id);
  });

  console.log(`Total duplicate destination IDs to remove: ${toDelete.length}`);
  console.log(JSON.stringify(toDelete));
}

analyze();

