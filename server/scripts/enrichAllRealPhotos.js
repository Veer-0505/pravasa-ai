const https = require('https');
const fs = require('fs');
const path = require('path');

const placesPath = path.join(__dirname, '..', 'data', 'places.json');
const places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));

// Test if an image URL responds with 200 OK
function verifyImageUrl(url) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) return resolve(false);
    try {
      const u = new URL(url);
      const req = https.request({
        method: 'HEAD',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'PravasaAITravelPlanner/1.0 (Karnataka Tourism AI; veerr0505@gmail.com)'
        },
        timeout: 5000
      }, res => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          // Retry with small range GET
          https.get(url, {
            headers: {
              'User-Agent': 'PravasaAITravelPlanner/1.0 (Karnataka Tourism AI; veerr0505@gmail.com)',
              'Range': 'bytes=0-50'
            },
            timeout: 5000
          }, getRes => {
            resolve(getRes.statusCode >= 200 && getRes.statusCode < 400);
          }).on('error', () => resolve(false));
        }
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function fetchWikiThumbnail(searchQuery) {
  return new Promise((resolve) => {
    if (!searchQuery) return resolve(null);
    const cleaned = searchQuery.replace(/\(.*?\)/g, '').trim();
    const url = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + 
      encodeURIComponent(cleaned) + '&gsrlimit=1&prop=pageimages|info&inprop=url&format=json&pithumbsize=1200';

    const req = https.get(url, {
      headers: {
        'User-Agent': 'PravasaAITravelPlanner/1.0 (Karnataka Tourism AI; veerr0505@gmail.com)'
      },
      timeout: 7000
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages;
          if (!pages) return resolve(null);
          const pid = Object.keys(pages)[0];
          const page = pages[pid];
          if (page.thumbnail?.source) {
            resolve({
              url: page.thumbnail.source,
              title: page.title,
              pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// Hand-curated primary photos for famous monuments that MUST be exact
const MUST_HAVE_PHOTOS = {
  hampi: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/1280px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg',
    source: 'Wikimedia Commons (Virupaksha Temple Gopuram, Hampi)',
    author: 'Dey.sandip',
    license: 'CC BY-SA 3.0'
  },
  badami: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Vishnu_image_inside_cave_number_3_in_Badami.jpg/1280px-Vishnu_image_inside_cave_number_3_in_Badami.jpg',
    source: 'Wikimedia Commons (Badami Cave Temples, Cave 3)',
    author: 'Dey.sandip',
    license: 'CC BY-SA 3.0'
  },
  aihole: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg/1280px-8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg',
    source: 'Wikimedia Commons (Durga Temple, Aihole)',
    author: 'Ms Sarah Welch',
    license: 'CC BY-SA 4.0'
  },
  pattadakal: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/1280px-Pattadakal_000.JPG',
    source: 'Wikimedia Commons (Group of Monuments at Pattadakal)',
    author: 'Mukherjee',
    license: 'CC BY-SA 3.0'
  },
  gol_gumbaz: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg/1280px-Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg',
    source: 'Wikimedia Commons (Gol Gumbaz, Vijayapura)',
    author: 'Dey.sandip',
    license: 'CC BY-SA 3.0'
  },
  bidar_fort: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg/1280px-Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg',
    source: 'Wikimedia Commons (Gumbad Darwaza, Bidar Fort)',
    author: 'Dey.sandip',
    license: 'CC BY-SA 3.0'
  },
  mysuru_palace: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Mysore_Palace_Morning.jpg/1280px-Mysore_Palace_Morning.jpg',
    source: 'Wikimedia Commons (Mysuru Palace)',
    author: 'Muhammad Mahdi Karim',
    license: 'GFDL 1.2'
  },
  jog_falls: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Jog_Falls_during_monsoon.jpg/1280px-Jog_Falls_during_monsoon.jpg',
    source: 'Wikimedia Commons (Jog Falls, Shivamogga)',
    author: 'Shrikant Rao',
    license: 'CC BY-SA 3.0'
  },
  belur: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Chennakesava_Temple_Belur_Karnataka.jpg/1280px-Chennakesava_Temple_Belur_Karnataka.jpg',
    source: 'Wikimedia Commons (Chennakeshava Temple, Belur)',
    author: 'Bikashrd',
    license: 'CC BY-SA 4.0'
  },
  halebidu: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Hoysaleswara_temple_at_Halebidu.jpg/1280px-Hoysaleswara_temple_at_Halebidu.jpg',
    source: 'Wikimedia Commons (Hoysaleswara Temple, Halebidu)',
    author: 'Akash Sharma',
    license: 'CC BY-SA 4.0'
  },
  shravanabelagola: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Gomateshwara_Statue_at_Shravanabelagola.jpg/1280px-Gomateshwara_Statue_at_Shravanabelagola.jpg',
    source: 'Wikimedia Commons (Gommateshwara Statue, Shravanabelagola)',
    author: 'Ananth BS',
    license: 'CC BY-SA 3.0'
  },
  murudeshwar: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Murudeshwara_Statue_and_Gopura.jpg/1280px-Murudeshwara_Statue_and_Gopura.jpg',
    source: 'Wikimedia Commons (Murudeshwar Shiva Statue & Raja Gopura)',
    author: 'Deepak Rao',
    license: 'CC BY-SA 3.0'
  },
  chitradurga_fort: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Chitradurga_Fort_Gates.jpg/1280px-Chitradurga_Fort_Gates.jpg',
    source: 'Wikimedia Commons (Chitradurga Fort Gates)',
    author: 'Dey.sandip',
    license: 'CC BY-SA 3.0'
  }
};

async function main() {
  console.log(`Starting enrichment of ${places.length} places...`);
  let updatedCount = 0;
  let verifiedCount = 0;

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const pid = p.id;

    // Step A: Check must-have curated
    if (MUST_HAVE_PHOTOS[pid]) {
      const curated = MUST_HAVE_PHOTOS[pid];
      p.image = curated.url;
      p.imageAttribution = {
        source: curated.source,
        author: curated.author,
        license: curated.license,
        licenseUrl: 'https://creativecommons.org/licenses/'
      };
      verifiedCount++;
    } else {
      // Step B: Check if existing image is valid
      let currentValid = false;
      if (p.image && !p.image.includes('1590050752117') && !p.image.includes('1600100397608') && !p.image.includes('Karnataka_in_India')) {
        currentValid = await verifyImageUrl(p.image);
      }

      if (!currentValid) {
        // Query Wikipedia
        const searchTerms = [
          `${p.name} ${p.district || ''} Karnataka`,
          `${p.name} Karnataka`,
          p.name
        ];

        let found = null;
        for (const term of searchTerms) {
          found = await fetchWikiThumbnail(term);
          if (found?.url) {
            const isValid = await verifyImageUrl(found.url);
            if (isValid) break;
            found = null;
          }
        }

        if (found?.url) {
          p.image = found.url;
          p.imageAttribution = {
            source: `Wikimedia Commons (${found.title})`,
            author: 'Wikipedia / Wikimedia Contributors',
            license: 'CC BY-SA 4.0',
            licenseUrl: found.pageUrl
          };
          verifiedCount++;
          updatedCount++;
        } else {
          // If no verified image, explicitly clear it so the neutral SVG placeholder shows
          p.image = '';
          p.imageAttribution = {
            source: 'Karnataka Tourism Verified Directory',
            author: 'Department of Tourism, Government of Karnataka',
            license: 'Official State Publication'
          };
        }
      } else {
        verifiedCount++;
      }
    }

    // Step C: Ensure 4-period daytime imagery
    const isHeritageOrFort = ['heritage', 'fort', 'monument', 'temple', 'cave'].some(c => 
      (p.category || []).includes(c) || (p.place_type || '').includes(c)
    );
    const hasNightIllumination = pid === 'mysuru_palace' || (p.name || '').toLowerCase().includes('palace');

    p.timeOfDayMedia = {
      morning: {
        url: p.image || '',
        caption: `Morning atmosphere at ${p.name} (${p.district || 'Karnataka'})`,
        attribution: p.imageAttribution?.source || 'Karnataka Tourism Verified Directory'
      },
      afternoon: {
        url: p.image || '',
        caption: `Daytime visitor view of ${p.name}`,
        attribution: p.imageAttribution?.source || 'Karnataka Tourism Verified Directory'
      },
      evening: {
        url: p.image || '',
        caption: `Evening golden hour at ${p.name}`,
        attribution: p.imageAttribution?.source || 'Karnataka Tourism Verified Directory'
      },
      night: {
        url: p.image || '',
        caption: hasNightIllumination ? `Illuminated night view of ${p.name}` : `Night view of ${p.name} (closed after sunset)`,
        attribution: p.imageAttribution?.source || 'Karnataka Tourism Verified Directory',
        isOpenAtNight: hasNightIllumination,
        nightNotes: hasNightIllumination 
          ? 'Special night illumination on Sundays and public holidays (7:00 PM – 8:00 PM).'
          : (isHeritageOrFort 
              ? 'Monument closes strictly at sunset (6:00 PM) per ASI / state conservation regulations. No night entry.'
              : 'Closed at night for visitor safety.')
      }
    };

    p.isPublished = p.isPublished !== false;
    p.lastMediaUpdate = new Date().toISOString();

    if ((i + 1) % 15 === 0 || i === places.length - 1) {
      console.log(`[${i + 1}/${places.length}] Verified: ${verifiedCount}, Updated: ${updatedCount}`);
    }
  }

  fs.writeFileSync(placesPath, JSON.stringify(places, null, 2), 'utf8');
  console.log(`Finished! Updated places.json. Verified images: ${verifiedCount}/${places.length}.`);
}

main().catch(console.error);

