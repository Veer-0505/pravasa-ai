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

async function findSimilar() {
  const { data } = await supabase.from('destinations').select('id, name, district, place_type, image');
  
  const groups = {};
  data.forEach(d => {
    if (d.place_type === 'district' || d.place_type === 'taluk') return;
    const c = cleanName(d.name);
    if (!c || c.length < 3) return;
    const key = `${c}__${(d.district || '').toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  const dupes = Object.entries(groups).filter(([k, list]) => list.length > 1);
  console.log('Similar/Duplicate destination pairs:', dupes.length);
  dupes.forEach(([k, list]) => {
    console.log(`Key: [${k}]`);
    list.forEach(item => {
      console.log(`   - ID: ${item.id} | Name: "${item.name}" | District: ${item.district}`);
    });
  });
}

findSimilar();

