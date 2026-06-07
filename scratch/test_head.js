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
    
    // Test HEAD
    const headRes = await fetch(mediaUrl, { method: 'HEAD', redirect: 'follow' });
    console.log('HEAD status:', headRes.status);
    console.log('HEAD url:', headRes.url);
  }
}).catch(console.error);
