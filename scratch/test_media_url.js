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
    console.log('Media URL:', mediaUrl);
    
    // Fetch the media URL to see what happens
    const imgRes = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TripJoy/1.0',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      redirect: 'follow'
    });
    console.log('Image fetch status:', imgRes.status);
    console.log('Image redirect URL:', imgRes.url);
  }
}).catch(console.error);
