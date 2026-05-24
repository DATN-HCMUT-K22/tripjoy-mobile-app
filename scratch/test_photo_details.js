const apiKey = "AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk";
const PLACES_BASE = "https://places.googleapis.com/v1";

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
    const json = await res.json();
    if (json.places && json.places.length > 0) {
      const firstPlace = json.places[0];
      console.log("First place name:", firstPlace.name);
      console.log("First place displayName:", firstPlace.displayName);
      console.log("First place types:", firstPlace.types);
      console.log("First place photos count:", firstPlace.photos ? firstPlace.photos.length : 0);
      if (firstPlace.photos && firstPlace.photos.length > 0) {
        console.log("First photo object:", firstPlace.photos[0]);
      }
    } else {
      console.log("No places found.");
    }
  } catch (err) {
    console.error("Error in textSearch:", err);
  }
}

textSearch("Hà Nội", 21.0285, 105.8542);
