const apiKey = "AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk";
const PLACES_BASE = "https://places.googleapis.com/v1";

async function getPlaceById(placeId) {
  const resourceName = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  const url = `${PLACES_BASE}/${resourceName}`;
  console.log("Fetching place details:", url);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "name,displayName,photos,types",
      },
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text:", text);
    return res.ok ? JSON.parse(text) : null;
  } catch (err) {
    console.error("Error in getPlaceById:", err);
    return null;
  }
}

async function textSearch(query, lat, lon) {
  const url = `${PLACES_BASE}/places:searchText`;
  console.log("Searching text:", query, lat, lon);
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lon },
        radius: 50000,
      },
    },
    maxResultCount: 5,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.name,places.displayName,places.photos,places.types",
      },
      body: JSON.stringify(body),
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text length:", text.length);
    const json = JSON.parse(text);
    console.log("Places found:", json.places ? json.places.map(p => p.displayName?.text) : "none");
    return json.places || [];
  } catch (err) {
    console.error("Error in textSearch:", err);
    return [];
  }
}

async function run() {
  // Let's test with a Place ID. In the user's warning log, it failed.
  // Let's assume we have an obsolete place ID first
  const obsoletePlaceId = "ChIJV9o7fWuvNTERq6mG4U6V-Gg"; // Hanoi's Place ID (might be valid or invalid)
  const place = await getPlaceById(obsoletePlaceId);
  
  if (!place) {
    console.log("\n--- Falling back to textSearch ---");
    const results = await textSearch("Hà Nội", 21.0285, 105.8542);
    console.log("Text search results count:", results.length);
  }
}

run();
