const fs = require('fs');
const path = require('path');

const apiKey = 'AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk';
const jsonPath = 'd:/tripjoy-api/src/main/resources/seed/locations/VN_PROVINCE.json';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPlaceId(query, lat, lng) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName'
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 50000
          }
        }
      })
    });
    const data = await res.json();
    if (data.places && data.places.length > 0) {
      return data.places[0].id;
    }
  } catch (err) {
    console.error(`Error fetching ${query}:`, err.message);
  }
  return null;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let updatedCount = 0;
  
  const sqlStatements = [];

  for (const province of data) {
    const query = `${province.name_en}, Vietnam`;
    console.log(`Checking ${query}...`);
    
    const newId = await fetchPlaceId(query, province.latitude, province.longitude);
    if (newId) {
      if (province.provider_id !== newId) {
        console.log(`  -> UPDATE needed: ${province.provider_id} -> ${newId}`);
        
        // Prepare SQL statement
        const sql = `UPDATE locations SET provider_id = '${newId}' WHERE name = '${province.name}';`;
        sqlStatements.push(sql);
        
        // Update JSON
        province.provider_id = newId;
        updatedCount++;
      } else {
        console.log(`  -> ID matches: ${newId}`);
      }
    } else {
      console.log(`  -> Not found for ${query}`);
    }
    
    // Rate limit to avoid 429
    await delay(300);
  }

  if (updatedCount > 0) {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${updatedCount} provinces in JSON.`);
    
    // Save SQL to file
    const sqlPath = 'd:/datn_tripjoy/scratch/update_locations.sql';
    fs.writeFileSync(sqlPath, sqlStatements.join('\n'));
    console.log(`Saved SQL migration to ${sqlPath}`);
  } else {
    console.log('All provinces are up to date.');
  }
}

main();
