const apiKey = "AIzaSyDsPh0C4RtY4HyzVrfsj45N7NGD16cVIpk";
const photoName = "places/ChIJoRyG2ZurNTERqRfKcnt_iOc/photos/Ab43m-tSZVk6XpG2u57ybJt8qCLvgjhrROcZSXy5UoEa0tnklJ2iTNSZ7edOPQa9_SxBNS5n0yyHALk_3KWORcBjJgsiuP6ug18RcHWtQkFeNZhq7VbGUB9hQOkYQHPmsj_s3a0R817wVoCyCaJjRc1h5n1aeaOEzuV-TN5JrxcDS4t215VilmY9oQ2ZFFobZE_NE3wC3k8Q53Y9v3zH28NueMnSNT6PGAuWIcd9mO96e9YlY0G1uSv57DL6FfRMPV4NpkQs-ed9dQpKdlpKZesKtm_-eCDIGVsyFp9hdyZMKr_8uGrYGbbKbRHM7alzySFGZBLF1m19p3dQ4r5JlHp3_UPjIl47f7hGii95N1NcjaAC8ccCtZXfiMJPKhpkXgLqVr-IFfre8o7xJCg2XjNqK8Y7l-BNKUdlFTvg_-0E9I0";

async function testPhotoUrl() {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
  console.log("Fetching photo URL:", url);
  try {
    const res = await fetch(url, {
      method: "GET",
    });
    console.log("Status:", res.status);
    console.log("Response headers:", [...res.headers.entries()]);
  } catch (err) {
    console.error("Error fetching photo URL:", err);
  }
}

testPhotoUrl();
