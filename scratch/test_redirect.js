const apiKey = 'AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk';
const placeId = 'places/ChIJfcAyBzCjCjERvakjgaWkA7E';
const url = `https://places.googleapis.com/v1/${placeId}`;

fetch(url, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'id,displayName,photos'
  }
}).then(res => res.json()).then(async data => {
  if (data.photos && data.photos.length > 0) {
    const photoName = data.photos[0].name;
    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=800`;
    
    // Test GET with redirect: manual
    const getRes = await fetch(mediaUrl, { method: 'GET', redirect: 'manual' });
    console.log('GET manual status:', getRes.status);
    console.log('GET manual url:', getRes.url);
    console.log('GET manual location header:', getRes.headers.get('location'));
  }
}).catch(console.error);
