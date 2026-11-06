const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('destinations').select('id, name, district, place_type, image');
  if (error) return console.error(error);
  
  console.log('Total destinations in Supabase:', data.length);
  
  // 1. Exact Name duplicates
  const nameMap = {};
  data.forEach(d => {
    const key = (d.name || '').trim().toLowerCase();
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(d);
  });
  
  const dupNames = Object.entries(nameMap).filter(([k, list]) => list.length > 1);
  console.log('Duplicate destination names count:', dupNames.length);
  dupNames.forEach(([name, list]) => {
    console.log(`- "${name}" (${list.length} times):`, list.map(x => `${x.id} [${x.district}]`).join(' | '));
  });

  // 2. Check places that are district headquarters or taluk entries posing as attractions
  const districtEntries = data.filter(d => d.place_type === 'district' || d.id.startsWith('dist_'));
  const talukEntries = data.filter(d => d.place_type === 'taluk' || d.id.startsWith('taluk_'));
  console.log('District wrapper entries in destinations table:', districtEntries.length);
  console.log('Taluk wrapper entries in destinations table:', talukEntries.length);
}

check();

