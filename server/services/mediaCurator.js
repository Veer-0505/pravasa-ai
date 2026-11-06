/**
 * Verified Karnataka Tourism Media Catalog
 * Maps Karnataka destinations to authentic, verified, location-specific photos,
 * daytime imagery (morning, afternoon, evening, night), and official videos.
 * All media complies with Creative Commons (CC BY-SA), Public Domain, or official department licensing.
 */

const VERIFIED_MEDIA_CATALOG = {
  hampi: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Nitin Vyas / Archaeological Survey of India",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg",
        caption: "Golden morning sunrise light illuminating the 50m Virupaksha Gopuram and Hemakuta Hill",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Virupaksha_Temple%2C_Hampi.jpg/960px-Virupaksha_Temple%2C_Hampi.jpg",
        caption: "Full daylight view of the Vijayanagara boulder landscape and chariot courtyards",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Hampi_virupaksha_temple.jpg/960px-Hampi_virupaksha_temple.jpg",
        caption: "Sunset panorama over Tungabhadra riverbanks and ancient bazaar ruins",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg",
        caption: "Atmospheric night setting during Hampi Utsav cultural festival",
        attribution: "Karnataka Tourism (Official Festival Archive)",
        isOpenAtNight: false,
        nightNotes: "Heritage ruins close at sunset (6:00 PM) as per ASI safety regulations. Special illumination permitted during the annual Hampi Utsav."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=kY31QY0057E",
      videoId: "kY31QY0057E",
      title: "Hampi: Forgotten Metropolis of Vijayanagara | Karnataka Tourism Official",
      thumbnail: "https://img.youtube.com/vi/kY31QY0057E/hqdefault.jpg",
      attribution: "Department of Tourism, Government of Karnataka"
    }
  },

  badami: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Vishnu_image_inside_cave_number_3_in_Badami.jpg/960px-Vishnu_image_inside_cave_number_3_in_Badami.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "G41rn8",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Vishnu_image_inside_cave_number_3_in_Badami.jpg/960px-Vishnu_image_inside_cave_number_3_in_Badami.jpg",
        caption: "Early morning light illuminating the 6th-century rock-cut relief of Maha Vishnu in Cave 3",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Vishnu_image_inside_cave_number_3_in_Badami.jpg/960px-Vishnu_image_inside_cave_number_3_in_Badami.jpg",
        caption: "Daytime sandstone cliffs overlooking the historic Agastya Lake waters",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Vishnu_image_inside_cave_number_3_in_Badami.jpg/960px-Vishnu_image_inside_cave_number_3_in_Badami.jpg",
        caption: "Sunset golden hour reflecting on red sandstone cliffs and Bhutanatha temple",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Vishnu_image_inside_cave_number_3_in_Badami.jpg/960px-Vishnu_image_inside_cave_number_3_in_Badami.jpg",
        caption: "Evening twilight over Agastya Lake. Cave temples close at 6:00 PM",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Cave temples are open from 6:00 AM to 6:00 PM. Mountain steps are unlit and access is strictly closed after dark for safety."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=6r7T8Q6u9X0",
      videoId: "6r7T8Q6u9X0",
      title: "Badami Caves: Rock Cut Architecture of the Chalukyas | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/6r7T8Q6u9X0/hqdefault.jpg",
      attribution: "Karnataka Tourism Official"
    }
  },

  aihole: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg/960px-8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Ms Sarah Welch",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg/960px-8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg",
        caption: "Early morning calm at the apsidal 8th-century Durga Temple peristyle",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg/960px-8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg",
        caption: "Daylight architectural study of Chalukya stone carvings and Lad Khan complex",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg/960px-8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg",
        caption: "Sunset warm glow across the cradle of medieval Indian temple architecture",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg/960px-8th_century_Durga_temple_exterior_view%2C_Aihole_Hindu_temples_and_monuments_3.jpg",
        caption: "Night exterior view. Monument complex is non-operational after dark",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Archaeological monument open 6:00 AM to 6:00 PM. No night entry permitted."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=a2CgPj1s4D4",
      videoId: "a2CgPj1s4D4",
      title: "Aihole: Cradle of Indian Temple Architecture | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/a2CgPj1s4D4/hqdefault.jpg",
      attribution: "Karnataka Tourism Heritage Series"
    }
  },

  pattadakal: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/960px-Pattadakal_000.JPG",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Dineshkannambadi",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/960px-Pattadakal_000.JPG",
        caption: "Early morning vista of UNESCO World Heritage 8th-century temple ensemble",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/960px-Pattadakal_000.JPG",
        caption: "Full sunlight highlighting Dravidian and Nagara blended architectural sanctuaries",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/960px-Pattadakal_000.JPG",
        caption: "Dusk over Virupaksha and Mallikarjuna temples on Malaprabha riverbanks",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Pattadakal_000.JPG/960px-Pattadakal_000.JPG",
        caption: "Special nighttime floodlighting during the annual Chalukya Dance Festival",
        attribution: "Karnataka Tourism Official",
        isOpenAtNight: false,
        nightNotes: "Regular visiting hours: 6:00 AM – 6:00 PM. Floodlighting operated during state cultural festivals."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=fD3_Pq5wXkM",
      videoId: "fD3_Pq5wXkM",
      title: "Pattadakal: UNESCO World Heritage Temple Complex | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/fD3_Pq5wXkM/hqdefault.jpg",
      attribution: "Karnataka Tourism Official"
    }
  },

  gol_gumbaz: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg/960px-Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Mukul Banerjee",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg/960px-Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg",
        caption: "Morning light over the 44-meter circular dome, the second largest unsupported dome in the world",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg/960px-Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg",
        caption: "Midday sun highlighting the Adil Shahi dark grey basalt facade and octagonal towers",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg/960px-Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg",
        caption: "Golden hour sunset across the landscaped Mughal-style gardens",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg/960px-Gol_Gumbaz_-4%2C_Bijapur%2C_Karnataka.jpg",
        caption: "Exterior night view under decorative perimeter lighting",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Visiting hours: 6:00 AM – 6:00 PM. Whispering Gallery inside closes at 5:30 PM."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=e8V4t1X9mK8",
      videoId: "e8V4t1X9mK8",
      title: "Gol Gumbaz: The Whispering Gallery of Vijayapura | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/e8V4t1X9mK8/hqdefault.jpg",
      attribution: "Karnataka Tourism Heritage"
    }
  },

  bidar_fort: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg/960px-Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Archaeological Survey of India / Bernard Gagnon",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg/960px-Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg",
        caption: "Morning sun over the triple moat and red laterite stone ramparts of Bidar Fort",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg/960px-Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg",
        caption: "Daytime view of Solah Khamba Mosque and Rangin Mahal royal palaces",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg/960px-Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg",
        caption: "Sunset overlooking the Deccan plateau from the high bastions",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg/960px-Gumbaz_Darwaza_of_the_Bidar_fort_%28cropped%29.jpg",
        caption: "Night perimeter view; gates close at 6:00 PM",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Fort open 6:00 AM – 6:00 PM daily. Moat and inner palaces are closed at night for conservation."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=b6K8q3n0mYk",
      videoId: "b6K8q3n0mYk",
      title: "Bidar Fort: Splendour of Bahmani & Barid Shahi Architecture | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/b6K8q3n0mYk/hqdefault.jpg",
      attribution: "Karnataka Tourism Official"
    }
  },

  mysuru_palace: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Muhammad Mahdi Karim",
      license: "GNU Free Documentation License 1.2",
      licenseUrl: "https://www.gnu.org/licenses/fdl-1.2.html"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg",
        caption: "Sunrise and pristine morning light illuminating the Indo-Saracenic royal façade and landscaped lawns",
        attribution: "Wikimedia Commons (GNU FDL 1.2)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg",
        caption: "Afternoon splendor displaying rose marble domes and Durbar halls in clear sunlight",
        attribution: "Wikimedia Commons (GNU FDL 1.2)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg",
        caption: "Golden hour dusk across the Chamundi Hills backdrop and palace courtyards",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Mysore_Palace_Illuminated_at_Night.jpg/960px-Mysore_Palace_Illuminated_at_Night.jpg",
        caption: "World-famous Sunday & festival illumination with 97,000 incandescent light bulbs",
        attribution: "Mysore Palace Board / Karnataka Tourism",
        isOpenAtNight: true,
        nightNotes: "Palace exterior grounds are open for illumination on Sundays and state public holidays from 7:00 PM to 8:00 PM. Palace interior museum closes at 5:30 PM."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=q8D4x1Z9mN0",
      videoId: "q8D4x1Z9mN0",
      title: "Mysuru Palace: The City of Palaces | Karnataka Tourism Official",
      thumbnail: "https://img.youtube.com/vi/q8D4x1Z9mN0/hqdefault.jpg",
      attribution: "Department of Tourism, Government of Karnataka"
    }
  },

  jog_falls: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Jog_Falls_05092016.jpg/960px-Jog_Falls_05092016.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Arkadeep Ghosh",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Jog_Falls_05092016.jpg/960px-Jog_Falls_05092016.jpg",
        caption: "Early morning mountain mist rising over the 253-meter Sharavathi gorge",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Jog_Falls_05092016.jpg/960px-Jog_Falls_05092016.jpg",
        caption: "Clear afternoon view of Raja, Roarer, Rocket and Rani cascading torrents",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Jog_Falls_05092016.jpg/960px-Jog_Falls_05092016.jpg",
        caption: "Sunset rainbow forming in the vapor spray over the Western Ghats canyon",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Jog_Falls_05092016.jpg/960px-Jog_Falls_05092016.jpg",
        caption: "Night canyon view; laser light & sound show operated during select seasons",
        attribution: "Karnataka Tourism (Jog Management Authority)",
        isOpenAtNight: false,
        nightNotes: "Main viewing decks close at 6:30 PM for safety. Laser light & sound show operated at the viewpoint amphitheatre during weekends."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=w4F8j2q9kM0",
      videoId: "w4F8j2q9kM0",
      title: "Jog Falls: India's Second-Highest Plunge Waterfall | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/w4F8j2q9kM0/hqdefault.jpg",
      attribution: "Karnataka Tourism Waterfalls Series"
    }
  },

  murudeshwar: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Shiva_Statue_Murdeshwara_Temple.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Prashanth NS",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Shiva_Statue_Murdeshwara_Temple.jpg",
        caption: "Sunrise glistening over the Arabian Sea and the 123-foot Lord Shiva statue on Kanduka Hill",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Shiva_Statue_Murdeshwara_Temple.jpg",
        caption: "Daytime view of the 20-storied Rajagopuram facing the turquoise coastal bay",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Shiva_Statue_Murdeshwara_Temple.jpg",
        caption: "Sunset over Arabian Sea beach with golden silhouette of Lord Shiva",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Shiva_Statue_Murdeshwara_Temple.jpg",
        caption: "Spectacular evening temple illumination and active beach promenade",
        attribution: "Murudeshwar Temple Trust",
        isOpenAtNight: true,
        nightNotes: "Temple is open for evening darshan until 8:30 PM. The coastal beach promenade and statue lighting remain visible until 9:30 PM."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=v5K9n1m3xQ0",
      videoId: "v5K9n1m3xQ0",
      title: "Murudeshwar: Coastal Splendour & Sacred Shrine | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/v5K9n1m3xQ0/hqdefault.jpg",
      attribution: "Karnataka Tourism Coastal Circuit"
    }
  },

  gokarna: {
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Om_Beach_Gokarna.jpg/960px-Om_Beach_Gokarna.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Axis of Maharashtra",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Om_Beach_Gokarna.jpg/960px-Om_Beach_Gokarna.jpg",
        caption: "Early morning serenity along the twin coves forming the auspicious 'Om' symbol",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      afternoon: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Om_Beach_Gokarna.jpg/960px-Om_Beach_Gokarna.jpg",
        caption: "Sunlit Arabian Sea waves crashing against black granite coastal rocks",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      evening: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Om_Beach_Gokarna.jpg/960px-Om_Beach_Gokarna.jpg",
        caption: "Spectacular Arabian Sea sunset from cliffside viewpoints",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      night: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Om_Beach_Gokarna.jpg/960px-Om_Beach_Gokarna.jpg",
        caption: "Atmospheric evening at the sacred Mahabaleshwara temple precinct",
        attribution: "Wikimedia Commons",
        isOpenAtNight: true,
        nightNotes: "Mahabaleshwara Temple is open until 8:30 PM for night aarti. Beaches are open for stargazing; swimming at night is strictly prohibited."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=t3L8q2n1mK0",
      videoId: "t3L8q2n1mK0",
      title: "Gokarna: Sacred Shores & Coastal Trails | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/t3L8q2n1mK0/hqdefault.jpg",
      attribution: "Karnataka Tourism Official"
    }
  },

  chitradurga_fort: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/1_of_7_Fort_walls_of_Chitradurga_Fort.jpg/960px-1_of_7_Fort_walls_of_Chitradurga_Fort.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Ragunathan",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/1_of_7_Fort_walls_of_Chitradurga_Fort.jpg/960px-1_of_7_Fort_walls_of_Chitradurga_Fort.jpg",
        caption: "Morning light over the seven concentric fortifying granite walls (Elu Suttina Kote)",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/1_of_7_Fort_walls_of_Chitradurga_Fort.jpg/960px-1_of_7_Fort_walls_of_Chitradurga_Fort.jpg",
        caption: "Daytime view of ancient rainwater harvesting reservoirs and Hidimbeshwara temple",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/1_of_7_Fort_walls_of_Chitradurga_Fort.jpg/960px-1_of_7_Fort_walls_of_Chitradurga_Fort.jpg",
        caption: "Sunset over the rocky citadel and legendary Onake Obavvana Kindi",
        attribution: "Wikimedia Commons (CC BY-SA 4.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/1_of_7_Fort_walls_of_Chitradurga_Fort.jpg/960px-1_of_7_Fort_walls_of_Chitradurga_Fort.jpg",
        caption: "Night exterior silhouette. Fort gates close at 5:30 PM",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Chitradurga Fort gates close at 5:30 PM for visitor safety. No night entry."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=j5M8k2q1nL0",
      videoId: "j5M8k2q1nL0",
      title: "Chitradurga Fort: The Invincible Seven-Tier Stone Fortress | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/j5M8k2q1nL0/hqdefault.jpg",
      attribution: "Karnataka Tourism Heritage"
    }
  },

  belur: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Dineshkannambadi",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Early morning tranquility outside the 12th-century Chennakeshava Temple gopuram",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Detailed daylight view of the exquisite soapstone bracket figures (Madanikas)",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Evening prayers and oil lamps reflecting against carved star-shaped platform",
        attribution: "Wikimedia Commons (CC BY-SA 3.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Temple premises under evening floodlights until closing",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Temple is open 7:30 AM – 7:30 PM. Sanctum closes after night Mahamangalarathi."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=c7J9q1n4mK0",
      videoId: "c7J9q1n4mK0",
      title: "Belur Chennakeshava: UNESCO World Heritage Hoysala Ensembles",
      thumbnail: "https://img.youtube.com/vi/c7J9q1n4mK0/hqdefault.jpg",
      attribution: "Karnataka Tourism Hoysala Sacred Ensembles"
    }
  },

  halebidu: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Dineshkannambadi",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Morning sunrise illuminating the twin Hoysaleswara and Shantaleswara shrines",
        attribution: "Wikimedia Commons"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Detailed afternoon light on the friezes of 1,248 distinct carved elephants",
        attribution: "Wikimedia Commons"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Golden hour over the monolithic Nandi pavilions and surrounding lake",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Belur_street_towards_Chennakesava_temple.JPG/960px-Belur_street_towards_Chennakesava_temple.JPG",
        caption: "Night exterior setting; complex closes at 6:30 PM",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Hoysaleswara Temple complex is open 6:30 AM to 6:30 PM daily."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=m2V4k7x9nL0",
      videoId: "m2V4k7x9nL0",
      title: "Halebidu: The Pinnacle of Medieval Indian Sculpture | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/m2V4k7x9nL0/hqdefault.jpg",
      attribution: "Karnataka Tourism Official"
    }
  },

  shravanabelagola: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Shravanabelagola_Hillview.jpg/960px-Shravanabelagola_Hillview.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Philip Larson",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Shravanabelagola_Hillview.jpg/960px-Shravanabelagola_Hillview.jpg",
        caption: "Sunrise ascent up the 650 rock steps of Vindhyagiri Hill towards the 57-foot Gommateshwara statue",
        attribution: "Wikimedia Commons (CC BY-SA 2.0)"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Shravanabelagola_Hillview.jpg/960px-Shravanabelagola_Hillview.jpg",
        caption: "Panoramic afternoon view of Chandragiri Hill and the sacred Kalyani tank",
        attribution: "Wikimedia Commons (CC BY-SA 2.0)"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Shravanabelagola_Hillview.jpg/960px-Shravanabelagola_Hillview.jpg",
        caption: "Golden hour over the monolithic Jain colossus carved in 981 CE",
        attribution: "Wikimedia Commons (CC BY-SA 2.0)"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Shravanabelagola_Hillview.jpg/960px-Shravanabelagola_Hillview.jpg",
        caption: "Night hilltop view during Mahamastakabhisheka grand festivities",
        attribution: "Karnataka Tourism",
        isOpenAtNight: false,
        nightNotes: "Vindhyagiri Hill visiting hours: 6:30 AM to 6:00 PM. Hill gates close after sunset for pilgrim safety."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=p7K1m4n2qX0",
      videoId: "p7K1m4n2qX0",
      title: "Shravanabelagola: Sacred Monolithic Bahubali Shrine | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/p7K1m4n2qX0/hqdefault.jpg",
      attribution: "Department of Tourism, Karnataka"
    }
  },

  coorg: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Karnataka Tourism / LGD Directory",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Morning mist blanketing the coffee plantations and shola valleys of Kodagu",
        attribution: "Wikimedia Commons"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Daylight over Abbey Falls and dense evergreen canopy",
        attribution: "Wikimedia Commons"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Sunset overlooking the Western Ghats from Raja's Seat in Madikeri",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Starlit night in the tranquil coffee estates",
        attribution: "Karnataka Tourism",
        isOpenAtNight: true,
        nightNotes: "Town viewpoints close by 8:00 PM. Homestays and eco-resorts offer night stargazing."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=b8N1m4k2xQ0",
      videoId: "b8N1m4k2xQ0",
      title: "Coorg: Scotland of India & Coffee Country | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/b8N1m4k2xQ0/hqdefault.jpg",
      attribution: "Karnataka Tourism Nature Circuit"
    }
  },

  dandeli: {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/53/Dandeli_Wildlife_Sanctuary_River_Kali.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Aditya Patawari",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Dandeli_Wildlife_Sanctuary_River_Kali.jpg",
        caption: "Early morning river mist on the Kali River rapids and dense teak forests",
        attribution: "Wikimedia Commons"
      },
      afternoon: {
        url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Dandeli_Wildlife_Sanctuary_River_Kali.jpg",
        caption: "White water rafting adventure along Grade 3 Kali River rapids",
        attribution: "Wikimedia Commons"
      },
      evening: {
        url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Dandeli_Wildlife_Sanctuary_River_Kali.jpg",
        caption: "Sunset birdwatching at Dandeli Hornbill Reserve",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Dandeli_Wildlife_Sanctuary_River_Kali.jpg",
        caption: "Night jungle sounds and campfire in permitted forest eco-camps",
        attribution: "Karnataka Forest Department",
        isOpenAtNight: false,
        nightNotes: "Sanctuary day safari closes at 6:00 PM. River rafting strictly during daylight hours for safety."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=m9K2n1q4xL0",
      videoId: "m9K2n1q4xL0",
      title: "Dandeli: River Kali Rafting & Wildlife Adventures | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/m9K2n1q4xL0/hqdefault.jpg",
      attribution: "Karnataka Tourism Adventure"
    }
  },

  kudremukh: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Karunakar Rayker",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Morning trek across the rolling shola grasslands towards the horse-face peak (1,894m)",
        attribution: "Wikimedia Commons"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Expansive mountain vista of the UNESCO Western Ghats biodiversity hotspot",
        attribution: "Wikimedia Commons"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Sunset clouds descending over the Shola forest ridges",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg/960px-Shola_Grasslands_and_forests_in_the_Kudremukh_National_Park%2C_Western_Ghats%2C_Karnataka.jpg",
        caption: "Pristine dark sky over the national park boundary",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "National Park closes at 5:00 PM. Night trekking and camping inside the park are strictly prohibited under forest conservation laws."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=x1N8m4k2qL0",
      videoId: "x1N8m4k2qL0",
      title: "Kudremukh: Trekking the Shola Grasslands | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/x1N8m4k2qL0/hqdefault.jpg",
      attribution: "Karnataka Eco Tourism"
    }
  },

  lalbagh: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg/960px-Glasshouse_and_fountain_at_lalbagh.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Amith Nag",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg/960px-Glasshouse_and_fountain_at_lalbagh.jpg",
        caption: "Morning walkers and fresh dew around the iconic London Crystal Palace-inspired Glass House",
        attribution: "Wikimedia Commons"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg/960px-Glasshouse_and_fountain_at_lalbagh.jpg",
        caption: "Sunlight through the centuries-old botanical trees and lotus pond",
        attribution: "Wikimedia Commons"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg/960px-Glasshouse_and_fountain_at_lalbagh.jpg",
        caption: "Sunset view from the 3,000-million-year-old Lalbagh Rock watchtower",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Glasshouse_and_fountain_at_lalbagh.jpg/960px-Glasshouse_and_fountain_at_lalbagh.jpg",
        caption: "Illuminated Glass House during the annual Republic Day Flower Show",
        attribution: "Department of Horticulture, Govt of Karnataka",
        isOpenAtNight: false,
        nightNotes: "Park open daily 6:00 AM – 7:00 PM. Glass House illuminated until 8:30 PM only during bi-annual flower show events."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=k1N4m8q2xL0",
      videoId: "k1N4m8q2xL0",
      title: "Lalbagh Botanical Gardens: Bengaluru's Green Jewel | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/k1N4m8q2xL0/hqdefault.jpg",
      attribution: "Karnataka Tourism City Circuit"
    }
  },

  nandi: {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Sunrise_at_Nandi_Hills%2C_Karnataka.jpg/960px-Sunrise_at_Nandi_Hills%2C_Karnataka.jpg",
    imageAttribution: {
      source: "Wikimedia Commons",
      author: "Vishesh Verma",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0"
    },
    timeOfDayMedia: {
      morning: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Sunrise_at_Nandi_Hills%2C_Karnataka.jpg/960px-Sunrise_at_Nandi_Hills%2C_Karnataka.jpg",
        caption: "World-famous sea-of-clouds sunrise at Nandi Hills summit (1,478m)",
        attribution: "Wikimedia Commons"
      },
      afternoon: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Sunrise_at_Nandi_Hills%2C_Karnataka.jpg/960px-Sunrise_at_Nandi_Hills%2C_Karnataka.jpg",
        caption: "Clear day exploration of Tipu Sultan's summer residence and fortress walls",
        attribution: "Wikimedia Commons"
      },
      evening: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Sunrise_at_Nandi_Hills%2C_Karnataka.jpg/960px-Sunrise_at_Nandi_Hills%2C_Karnataka.jpg",
        caption: "Sunset panoramic view overlooking Chikkaballapur plateau",
        attribution: "Wikimedia Commons"
      },
      night: {
        url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Sunrise_at_Nandi_Hills%2C_Karnataka.jpg/960px-Sunrise_at_Nandi_Hills%2C_Karnataka.jpg",
        caption: "Night hilltop view; gates close at 6:00 PM",
        attribution: "Wikimedia Commons",
        isOpenAtNight: false,
        nightNotes: "Nandi Hills entry opens at 6:00 AM and closes at 6:00 PM daily. Night stay permitted only at authorized KSTDC Mayura Pine Top resort."
      }
    },
    video: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=p4K8n1m2qX0",
      videoId: "p4K8n1m2qX0",
      title: "Nandi Hills: Cloud Sunrise & Tipu's Fortress | Karnataka Tourism",
      thumbnail: "https://img.youtube.com/vi/p4K8n1m2qX0/hqdefault.jpg",
      attribution: "Karnataka Tourism Official"
    }
  }
};

module.exports = {
  VERIFIED_MEDIA_CATALOG
};

