"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from "recharts";

const AMP_MCP = { type: "url", url: "https://mcp.amplitude.com/mcp", name: "amplitude" };
const AMP_PROJECT_ID = "369968";

const AMP_EVENTS = ["[AI Feedback] Feedback","[Experiment] Assignment","[Experiment] Exposure","Application Installed","Backend Invest Deposit Received","Backend Invest Fiat Withdrawal","Backend KYB Accepted","Backend KYC Accepted","Backend Life Flow Started","Backend Referral Signup","Backend Signup Success","Backend Subscription Cancelled","Backend Subscription Renewal","Backend Subscription Started","Device Verification Code Resent","Email Opened","Invest Life Insurance Deposit Success Viewed","Life Contract Active","Life Contract First Deposit","Mobile ATT Prompt Replied","Mobile Add Asset Started","Mobile Add Asset Success","Mobile Asset Search Clicked","Mobile Black Friday Button Header Tapped","Mobile Cashflow Drilled","Mobile Cashflow Tapped","Mobile Failed Payment Banner Viewed","Mobile Feedback","Mobile Finary Invest Wrapper Closed","Mobile Finary Plus Button Tapped","Mobile Institution Connection Reconnect Tapped","Mobile Intercom Help Modal View","Mobile Invest Buy Crypto Success","Mobile Invest Crypto Actions Card Buy Tapped","Mobile Invest Crypto Actions Card Deposit Tapped","Mobile Invest Crypto Actions Card Plan Tapped","Mobile Invest Fiat Withdrawal Success","Mobile Invest KYC Success","Mobile Invest Plan Create Success","Mobile Invest Plan Delete Failed","Mobile Invest Plan Edit Failed","Mobile Invest Plan Tapped","Mobile Invest Sell Crypto Success","Mobile Invest Send Crypto Failed","Mobile Invest Swap Crypto Failed","Mobile Login Failed","Mobile Login Platform Button Clicked","Mobile Newsfeed Card Tapped","Mobile Notifications Opt In","Mobile Onboarding Add Asset Search Skip Tapped","Mobile Onboarding Investor Goal Crypto Tapped","Mobile Onboarding Investor Goal Invest Tapped","Mobile Onboarding Investor Goal Track Tapped","Mobile Onboarding Questionnaire Age","Mobile Onboarding Questionnaire Investor Level","Mobile Onboarding Questionnaire Wealth Level","Mobile Portfolio Tab Tapped","Mobile Post Subscription Budget Viewed","Mobile Post Subscription Dividends Viewed","Mobile Post Subscription Landing Viewed","Mobile Post Subscription Recurring Payments Viewed","Mobile Product Tour Closed","Mobile Recurring Transaction Edited","Mobile Report User Asset Submitted","Mobile Settings Black Friday Button Tapped","Mobile Signup Success","Mobile Transaction Category Changed","Mobile Transaction Edited","Mobile Transaction Set Include In Analysis","Mobile Transaction Set Marked","Mobile Transaction Smart Rule Edited","Mobile Transaction Subcategory Changed","Mobile Widget Added","Push Attempted","Push Delivered","Push Notification Tapped","Push Opened","Referral Bottom Sheet Share Tapped","Trial Started","Viewed Account","Viewed AddAsset","Viewed AddAssetCheckingAccountManual","Viewed AddAssetInstitution","Viewed AddAssetSynchronization","Viewed AssetTracked","Viewed AssetsLeaderboardBottomSheet","Viewed Cashflow","Viewed Cashflow Transactions","Viewed ConnectMoreAccountsBottomSheet","Viewed Connections","Viewed CryptosList","Viewed Dashboard","Viewed FamilyBottomSheet","Viewed FeaturesShowcase","Viewed Fees","Viewed FinaryPlusBottomSheet","Viewed Goals","Viewed GoalsReassurance","Viewed InvestCrypto","Viewed InvestCryptoFiatWithdraw","Viewed InvestCryptoFiatWithdrawConfirm","Viewed InvestCryptoOnboardingCompanyReassurance","Viewed InvestCryptoSavingsPlanChooseAssets","Viewed InvestCryptoSavingsPlanSetUpRecurringBuySummary","Viewed InvestCryptoSendProcessing","Viewed InvestLifeInsurance","Viewed InvestLifeInsuranceDepositFundsOrigin","Viewed InvestLifeInsuranceDepositSummary","Viewed InvestOnboardingPersonalReassurance","Viewed InvestOnboardingPersonalTaxStatus","Viewed InvestorGoal","Viewed InvestorLevelReassurance","Viewed Insights","Viewed Login","Viewed Manage Smart Rules","Viewed NotificationsBottomSheet","Viewed OnboardingAge","Viewed OnboardingLoader","Viewed OrganizationNeeds","Viewed PaywallProducts","Viewed PinSuccess","Viewed PostSubscriptionStories","Viewed RealEstate","Viewed ReferralBottomSheet","Viewed ReferralInvitation","Viewed ReferralInvitationSuccess","Viewed ReferralInvitations","Viewed ReviewBottomSheet","Viewed RoadmapIncome","Viewed RoadmapIntro","Viewed RoadmapLoader","Viewed RoadmapSafetyNetAccounts","Viewed RoadmapSafetyNetTasksRecap","Viewed RoadmapSavingsRate","Viewed SetPin","Viewed Settings","Viewed SignupSuccess","Viewed VerifyEmailSuccess","Viewed WealthLevel","Viewed Welcome","Viewed WidgetInstructions","Viewed WidgetInstructionsDetails","Viewed WidgetNudge","Web Black Friday Card Clicked","Web Black Friday Modal Clicked","Web Cashflow Smart Rule Edited","Web Cashflow Tapped","Web Chart Export","Web Onboarding Questionnaire Goal","Web Onboarding Questionnaire Source","Web Provider Webview Redirect","Web Referral Link Shared","Web Referral Link Sharing Started","Web Settings Linked Accounts Opened","Web Smart Rule Created","Web Subscription Expired","Web Tap on a transaction","Web Transaction MultiSelect Set","Web Transaction category change","Web Transaction create custom category","Web Transaction create custom subcategory","Web Transaction subcategory change","Web Yearly Upgrade Banner","product_change_event"].sort();

function extractVideoId(u: string) {
  const m = u.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function fmt(d: Date) { return d.toISOString().split("T")[0]; }

async function fetchYouTubeInfo(videoId: string) {
  const res = await fetch("/api/youtube-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl: "https://www.youtube.com/watch?v=" + videoId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "HTTP " + res.status }));
    throw new Error(err.error || "HTTP " + res.status);
  }
  const data = await res.json();
  if (!data.title) throw new Error("Titre non trouvé");
  return data;
}

async function callQueryDataset(eventName: string, startDate: string, endDate: string, metric: string) {
  const definition = {
    name: metric + " " + eventName,
    type: "eventsSegmentation",
    app: AMP_PROJECT_ID,
    params: {
      start: startDate, end: endDate, interval: 1, metric,
      countGroup: "User",
      events: [{ event_type: eventName, filters: [], group_by: [] }],
      groupBy: [], segments: [{ conditions: [] }]
    }
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      mcp_servers: [AMP_MCP],
      system: `You are a tool executor. Call the query_dataset MCP tool with projectId="${AMP_PROJECT_ID}" and the given definition. After the tool call, output ONLY the JSON from the tool result, nothing else.`,
      messages: [{ role: "user", content: `Call query_dataset with projectId="${AMP_PROJECT_ID}" and definition=${JSON.stringify(definition)}. Output only the tool result JSON.` }]
    })
  });
  const data = await res.json();
  if (data.type === "error") throw new Error(data.error?.message || "API error");
  const toolBlock = (data.content || []).find((b: any) => b.type === "mcp_tool_result");
  if (toolBlock) {
    const raw = toolBlock.content?.[0]?.text || toolBlock.content || "";
    const str = typeof raw === "string" ? raw : JSON.stringify(raw);
    try { return JSON.parse(str); } catch { return { raw: str }; }
  }
  const txt = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const m = txt.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return { raw: txt };
}

function parseAmpResult(result: any) {
  if (!result) return { total: 0, daily: [] as any[] };
  let r = result;
  if (r.success && r.data) r = r.data;
  if (r.data && (r.data.isCsvResponse !== undefined || r.data.jsonResponse)) r = r.data;
  if (r.isCsvResponse) {
    const rows = r.csvResponse?.data || [];
    let dates: string[] = [], vals: number[] = [];
    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const first = String(row[0] ?? "");
      if (first === "Segment") { dates = row.slice(1).map(String); continue; }
      const nums = row.slice(1);
      const hasNums = nums.some((v: any) => typeof v === "number" || (typeof v === "string" && !isNaN(parseFloat(v))));
      if (hasNums && vals.length === 0) vals = nums.map((v: any) => Number(v ?? 0));
    }
    if (dates.length > 0 && vals.length > 0) {
      return { total: vals.reduce((a: number, v: number) => a + v, 0), daily: dates.map((d, i) => ({ date: d.substring(0, 10), count: vals[i] ?? 0 })) };
    }
  }
  if (r.jsonResponse) {
    const jr = r.jsonResponse;
    const ts = jr.timeSeries?.[0] ?? [];
    const overall = jr.overallSeries?.[0];
    const total = (Array.isArray(overall) ? overall[0]?.value : overall?.value) ?? ts.reduce((a: number, v: any) => a + (v?.value ?? 0), 0);
    return { total, daily: (jr.xValuesForTimeSeries || []).map((d: any, i: number) => ({ date: String(d).substring(0, 10), count: ts[i]?.value ?? 0 })) };
  }
  return { total: 0, daily: [] as any[] };
}

function ImpactChart({ baseline, postVideo, pubDate }: any) {
  const allDates = [...baseline.daily.map((d: any) => d.date), ...postVideo.daily.map((d: any) => d.date)].sort();
  const baseMap: any = {};
  baseline.daily.forEach((d: any) => { baseMap[d.date] = d.count; });
  const postMap: any = {};
  postVideo.daily.forEach((d: any) => { postMap[d.date] = d.count; });
  const chartData = allDates.map((date: string) => ({
    date: date.slice(5),
    baseline: baseMap[date] ?? null,
    "post-video": postMap[date] ?? null,
  }));
  return (
    <div className="mt-5">
      <h3 className="text-sm font-medium text-gray-600 mb-3">Courbe d&apos;impact</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine x={pubDate.slice(5)} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Video", position: "top", fontSize: 11, fill: "#f59e0b" }} />
          <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line type="monotone" dataKey="post-video" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricBox({ label, value, sub, color = "blue" }: any) {
  const colors: any = { blue: "text-blue-600", green: "text-green-600", orange: "text-orange-600", purple: "text-purple-600" };
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [pubDate, setPubDate] = useState("");
  const [totalViews, setTotalViews] = useState("");
  const [retentionPct, setRetentionPct] = useState("50");
  const [fetchingVideo, setFetchingVideo] = useState(false);
  const [videoFetched, setVideoFetched] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [customEvent, setCustomEvent] = useState("");
  const [ctaDescription, setCtaDescription] = useState("");
  const [results, setResults] = useState<any>(null);

  const filteredEvents = AMP_EVENTS.filter(e => !eventSearch || e.toLowerCase().includes(eventSearch.toLowerCase()));
  const activeEvent = selectedEvent === "__custom" ? customEvent : selectedEvent;
  const videoId = extractVideoId(videoUrl);

  async function fetchVideoInfo() {
    if (!videoId) { setError("URL YouTube invalide"); return; }
    setFetchingVideo(true); setError(null);
    try {
      const info = await fetchYouTubeInfo(videoId);
      if (info.title) setVideoTitle(info.title);
      if (info.views) setTotalViews(String(info.views));
      if (info.publishedAt) setPubDate(info.publishedAt);
      setVideoFetched(true);
    } catch (e: any) {
      setError("Erreur: " + e.message);
      setVideoFetched(true);
    }
    setFetchingVideo(false);
  }

  async function analyzeImpact() {
    setLoading(true); setError(null);
    const pubTs = new Date(pubDate);
    const j1End = new Date(pubTs); j1End.setDate(j1End.getDate() + 1);
    const postEnd = new Date(pubTs); postEnd.setDate(postEnd.getDate() + 3);
    const baseEnd = new Date(pubTs); baseEnd.setDate(baseEnd.getDate() - 1);
    const baseStart = new Date(pubTs); baseStart.setDate(baseStart.getDate() - 7);
    try {
      setLoadingMsg("Récupération J+1..."); const j1Totals = await callQueryDataset(activeEvent, fmt(pubTs), fmt(j1End), "totals");
      setLoadingMsg("Récupération post-vidéo (totaux)..."); const postTotals = await callQueryDataset(activeEvent, fmt(pubTs), fmt(postEnd), "totals");
      setLoadingMsg("Récupération post-vidéo (uniques)..."); const postUniques = await callQueryDataset(activeEvent, fmt(pubTs), fmt(postEnd), "uniques");
      setLoadingMsg("Récupération baseline..."); const baseTotals = await callQueryDataset(activeEvent, fmt(baseStart), fmt(baseEnd), "totals");

      const j1 = parseAmpResult(j1Totals);
      const post = parseAmpResult(postTotals);
      const postU = parseAmpResult(postUniques);
      const base = parseAmpResult(baseTotals);

      const viewsAtCTA = Math.round((parseInt(totalViews) || 0) * (parseFloat(retentionPct) / 100));
      const bAvg = base.total / Math.max(base.daily.length || 7, 1);
      const pAvg = post.total / Math.max(post.daily.length || 3, 1);
      const uplift = bAvg > 0 ? ((pAvg - bAvg) / bAvg * 100) : 0;
      const conv = viewsAtCTA > 0 ? (postU.total / viewsAtCTA * 100) : 0;
      const j1Uplift = bAvg > 0 ? ((j1.total - bAvg) / bAvg * 100) : 0;

      setResults({
        post_video: { total_events: post.total, unique_users: postU.total, daily: post.daily },
        baseline: { total_events: base.total, daily: base.daily },
        j1: { total_events: j1.total, uplift: Math.round(j1Uplift * 10) / 10 },
        viewsAtCTA, baselineAvgDaily: Math.round(bAvg * 10) / 10,
        postAvgDaily: Math.round(pAvg * 10) / 10,
        uplift: Math.round(uplift * 10) / 10,
        conversionRate: Math.round(conv * 100) / 100,
        eventName: activeEvent,
        _debug: (post.total === 0 && base.total === 0) ? { postTotals, baseTotals } : null
      });
      setStep(3);
    } catch (e: any) { setError("Erreur analyse: " + e.message); }
    setLoading(false);
  }

  function resetAll() {
    setStep(1); setResults(null); setVideoUrl(""); setVideoTitle(""); setPubDate("");
    setTotalViews(""); setRetentionPct("50"); setSelectedEvent(""); setCustomEvent("");
    setCtaDescription(""); setVideoFetched(false); setEventSearch("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">YouTube CTA Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Mesure l&apos;efficacité de tes CTAs YouTube sur tes features produit</p>
        </div>

        <div className="flex items-center gap-1 mb-6">
          {["Vidéo", "Feature", "Résultats"].map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i+1 < step ? "bg-green-500 text-white" : i+1 === step ? "bg-blue-600 text-white ring-2 ring-blue-300" : "bg-gray-200 text-gray-500"}`}>
                {i+1 < step ? "✓" : i+1}
              </div>
              <span className={`text-xs hidden sm:inline ${i+1 === step ? "text-blue-700 font-semibold" : "text-gray-400"}`}>{s}</span>
              {i < 2 && <div className="w-6 h-px bg-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-500 font-bold">✕</button>
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-3 py-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">{loadingMsg}</span>
          </div>
        )}

        {step === 1 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-lg mb-4">Informations vidéo</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien YouTube</label>
                <div className="flex gap-2">
                  <input type="url" value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setVideoFetched(false); }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <button onClick={fetchVideoInfo} disabled={!videoId || fetchingVideo}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg flex items-center gap-1.5">
                    {fetchingVideo ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Chargement...</span></> : "▶ Récupérer"}
                  </button>
                </div>
              </div>
              {videoId && videoFetched && (
                <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="Thumbnail" className="w-full rounded-lg border border-gray-200" />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre {videoFetched && videoTitle && <span className="text-green-600 text-xs ml-1">✓ auto</span>}</label>
                <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Titre de la vidéo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication {videoFetched && pubDate && <span className="text-green-600 text-xs ml-1">✓</span>}</label>
                  <input type="date" value={pubDate} onChange={e => setPubDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vues {videoFetched && totalViews && <span className="text-green-600 text-xs ml-1">✓</span>}</label>
                  <input type="number" value={totalViews} onChange={e => setTotalViews(e.target.value)} placeholder="15000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">% rétention au moment du CTA</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={retentionPct} onChange={e => setRetentionPct(e.target.value)} className="flex-1 accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="100" value={retentionPct} onChange={e => setRetentionPct(e.target.value)}
                      className="w-14 border border-gray-300 rounded px-2 py-1 text-sm text-center font-mono focus:outline-none" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">YouTube Studio → Analytics → Rétention d&apos;audience</p>
              </div>
              <button onClick={() => setStep(2)} disabled={!videoTitle || !pubDate || !totalViews}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === 2 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-lg mb-2">Mapping CTA → Feature</h2>
            <p className="text-xs text-gray-400 mb-4">{videoTitle} · {parseInt(totalViews).toLocaleString()} vues</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Amplitude <span className="text-xs text-purple-600 font-normal">({AMP_EVENTS.length} events)</span></label>
                <div className="space-y-2">
                  <input type="text" value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Rechercher un event..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      {filteredEvents.length === 0
                        ? <div className="px-3 py-2 text-sm text-gray-400 italic">Aucun event trouvé</div>
                        : filteredEvents.map((ev, i) => (
                          <button key={i} onClick={() => { setSelectedEvent(ev); setCustomEvent(""); }}
                            className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-0 transition-colors ${selectedEvent === ev ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
                            {ev}
                          </button>
                        ))}
                    </div>
                    <button onClick={() => setSelectedEvent("__custom")}
                      className={`w-full text-left px-3 py-2 text-xs border-t border-gray-200 ${selectedEvent === "__custom" ? "bg-yellow-50 text-yellow-700" : "text-gray-400 hover:bg-gray-50"}`}>
                      ✏️ Saisir manuellement
                    </button>
                  </div>
                  {selectedEvent && selectedEvent !== "__custom" && (
                    <p className="text-xs text-blue-600 font-mono bg-blue-50 rounded px-2 py-1">✓ {selectedEvent}</p>
                  )}
                  {selectedEvent === "__custom" && (
                    <input type="text" value={customEvent} onChange={e => setCustomEvent(e.target.value)} placeholder="Nom exact de l'event"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description du CTA</label>
                <input type="text" value={ctaDescription} onChange={e => setCtaDescription(e.target.value)} placeholder="Ex: Essayez l'export PDF gratuitement"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">← Retour</button>
                <button onClick={analyzeImpact} disabled={!activeEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg text-sm">
                  🔍 Analyser l&apos;impact
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && results && !loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-lg mb-1">Résultats — {videoTitle}</h2>
              <p className="text-xs text-gray-400 mb-4">Event: {results.eventName} · Publié le {pubDate} · 3j post-publication</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                <MetricBox label="Vues au CTA" value={(results.viewsAtCTA || 0).toLocaleString()} sub={retentionPct + "% de " + parseInt(totalViews).toLocaleString()} color="blue" />
                <MetricBox label="J+1 events" value={(results.j1?.total_events || 0).toLocaleString()} sub={"uplift " + (results.j1?.uplift > 0 ? "+" : "") + results.j1?.uplift + "%"} color={results.j1?.uplift > 0 ? "green" : "orange"} />
                <MetricBox label="Conversion" value={results.conversionRate + "%"} sub="users / vues CTA" color="green" />
                <MetricBox label="Uplift J+3" value={(results.uplift > 0 ? "+" : "") + results.uplift + "%"} sub={results.baselineAvgDaily + "/j → " + results.postAvgDaily + "/j"} color={results.uplift > 0 ? "green" : "orange"} />
                <MetricBox label="Users post-vidéo" value={(results.post_video?.unique_users || 0).toLocaleString()} sub="3 jours" color="purple" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Baseline (7j avant)</h3>
                  <div className="space-y-1">
                    {(results.baseline?.daily || []).map((d: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs"><span className="text-gray-500">{d.date}</span><span className="font-mono">{d.count}</span></div>
                    ))}
                    <div className="flex justify-between text-xs font-semibold border-t pt-1 mt-1"><span>Total</span><span>{results.baseline?.total_events}</span></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Post-vidéo (3j)</h3>
                  <div className="space-y-1">
                    {(results.post_video?.daily || []).map((d: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs"><span className="text-gray-500">{d.date}</span><span className="font-mono">{d.count}</span></div>
                    ))}
                    <div className="flex justify-between text-xs font-semibold border-t pt-1 mt-1"><span>Total</span><span>{results.post_video?.total_events}</span></div>
                  </div>
                </div>
              </div>
              {results._debug && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-orange-600 font-medium">⚠️ Données à 0 — réponse brute</summary>
                  <pre className="mt-2 bg-gray-50 rounded p-2 overflow-auto max-h-48 text-gray-600 whitespace-pre-wrap">{JSON.stringify(results._debug, null, 2)}</pre>
                </details>
              )}
              <ImpactChart baseline={results.baseline} postVideo={results.post_video} pubDate={pubDate} />
              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Interprétation</h3>
                <p className="text-xs text-blue-700">
                  {results.uplift > 20 ? `Fort impact ! Usage en hausse de ${results.uplift}% après la vidéo.`
                    : results.uplift > 5 ? `Impact modéré (${results.uplift}%). Effet positif mais optimisable.`
                    : results.uplift > 0 ? `Impact faible (${results.uplift}%). CTA à repositionner.`
                    : `Pas d'impact détecté (${results.uplift}%). Reconsidère le placement.`}
                  {" "}Conversion brute : {results.conversionRate}% des viewers au CTA ont activé la feature.
                </p>
              </div>
            </div>
            <button onClick={resetAll} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm">
              + Analyser un autre CTA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}