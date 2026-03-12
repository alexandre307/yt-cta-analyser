const APIFY_TOKEN = process.env.APIFY_TOKEN;

export default async function handler(req, res) {
  // CORS headers — allows calls from any Claude artifact
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { videoUrl } = req.body;
  if (!videoUrl) return res.status(400).json({ error: "videoUrl manquant" });

  try {
    // 1. Lancer le run Apify (sync — attend la fin + retourne les items directement)
    const apifyRes = await fetch(
      `https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120&memory=256`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: videoUrl }],
          maxVideos: 1,
          maxResultStreams: 0,
          maxResultsShorts: 0,
        }),
      }
    );

    if (!apifyRes.ok) {
      const errText = await apifyRes.text();
      return res.status(500).json({ error: `Apify error ${apifyRes.status}: ${errText.slice(0, 200)}` });
    }

    const items = await apifyRes.json();
    const item = Array.isArray(items) ? items[0] : null;

    if (!item) return res.status(404).json({ error: "Aucun résultat Apify" });

    return res.status(200).json({
      title: item.title || item.videoTitle || "",
      views: parseInt(item.viewCount || item.views || item.numberOfViews || 0),
      publishedAt: (item.uploadedAt || item.publishedAt || item.date || "").split("T")[0],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}