import { NextRequest, NextResponse } from "next/server";

const APIFY_TOKEN = process.env.APIFY_TOKEN!;

export async function POST(req: NextRequest) {
  const { videoUrl } = await req.json();
  if (!videoUrl) return NextResponse.json({ error: "videoUrl manquant" }, { status: 400 });

  try {
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
      return NextResponse.json({ error: `Apify error ${apifyRes.status}: ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const items = await apifyRes.json();
    const item = Array.isArray(items) ? items[0] : null;
    if (!item) return NextResponse.json({ error: "Aucun résultat Apify" }, { status: 404 });

    return NextResponse.json({
      title: item.title || item.videoTitle || "",
      views: parseInt(item.viewCount || item.views || item.numberOfViews || 0),
      publishedAt: (item.uploadedAt || item.publishedAt || item.date || "").split("T")[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}