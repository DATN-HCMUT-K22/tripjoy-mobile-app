const apiKey = 'AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk';
const photoName = 'places/ChIJfcAyBzCjCjERvakjgaWkA7E/photos/AaVGc3nW4SGFEcX0zWJT3TsVPXpsM0uptkfOmZM83DOygJjYGeehZOzg0QaEnPaNYS0g7PwBUBifcMZxFdjAx4hYKzFN2Hendr23ep90wyBjfhXYETIdb0J0V3gZshDIBKWLWn6300pg0hevytBXCECxr9o78BP8smJvI7PNjMsV9YqUYu8Q25zI63V31iFR4sjeKApkf-HpeDFJOmMBFmK0q8QM_OG_TR7if6fyRcoRp7wn_zMLimSWvrLndapLEsX4Z1GEJnmdC0VH6Ez9AimzR3EzAmi5X3bD_Ua3BbARxegI2snDw_CULUI6JuyCi0nQTRRduASzg1h7dyaxJ19notzwIGpqaUqdqKRsdOrigQBk0pp0tjGMrnjHoqPCl2s6LGTbBiihhK2-mHlB_DE94dmlZwVjL2oSKbtcUM4rdACwh4rmnnv8NQrD_vmHu6nG';
const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=800&skipHttpRedirect=true`;

fetch(mediaUrl, { method: 'GET' })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
