const https = require('https');

const options = {
  method: 'GET',
  hostname: 'booking-com15.p.rapidapi.com',
  port: null,
  path: '/api/v1/hotels/searchHotels?dest_id=-3714993&search_type=city&arrival_date=2026-06-15&departure_date=2026-06-16&adults=2&room_qty=1&page_number=1',
  headers: {
    'x-rapidapi-key': 'e30d2fe3e9mshe5808addc1184eep105a44jsn9c339acf91a7',
    'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
  }
};

const req = https.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
