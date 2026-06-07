const apiKey = "AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk";
const placeId = "places/ChIJfcAyBzCjCjERvakjgaWkA7E";
const url = `https://places.googleapis.com/v1/${placeId}`;

fetch(url, {
  method: "GET",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "id,displayName,photos"
  }
}).then(res => res.json()).then(console.log).catch(console.error);
