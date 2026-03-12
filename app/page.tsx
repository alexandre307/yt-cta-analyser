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
      <h3 style={{fontSize:".7rem",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#333",marginBottom:".75rem"}}>Courbe d&apos;impact</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill:"#444" }} axisLine={{stroke:"#222"}} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill:"#444" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background:"#111", border:"1px solid #222", borderRadius:10, fontSize:12, color:"#e0e0e0" }} labelStyle={{color:"#666"}} />
          <Legend wrapperStyle={{ fontSize: 12, color:"#555" }} />
          <ReferenceLine x={pubDate.slice(5)} stroke="#ff4444" strokeDasharray="4 4" label={{ value: "Vidéo", position: "top", fontSize: 11, fill: "#ff4444" }} />
          <Line type="monotone" dataKey="baseline" stroke="#333" strokeWidth={2} dot={{ r: 3, fill:"#333" }} connectNulls={false} />
          <Line type="monotone" dataKey="post-video" stroke="#ff4444" strokeWidth={2.5} dot={{ r: 4, fill:"#ff4444" }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricBox({ label, value, sub, color = "blue" }: any) {
  const colors: any = { blue: "#3b82f6", green: "#22c55e", orange: "#f97316", purple: "#a855f7" };
  return (
    <div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:12,padding:"1rem",textAlign:"center"}}>
      <div style={{fontSize:".68rem",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#3a3a3a",marginBottom:".35rem"}}>{label}</div>
      <div style={{fontSize:"1.5rem",fontWeight:800,color:colors[color],fontFamily:"'Syne',sans-serif",lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:".68rem",color:"#3a3a3a",marginTop:".3rem"}}>{sub}</div>}
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
    <div className="min-h-screen p-4 sm:p-8" style={{background:"#080808",color:"#e0e0e0",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box}.step-pill{display:flex;align-items:center;gap:6px;padding:8px 4px;border-bottom:2px solid transparent;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#333;cursor:default}.step-pill.active{color:#fff;border-bottom-color:#ff4444}.step-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;background:#1a1a1a;color:#333}.step-pill.active .step-num{background:#ff4444;color:#fff}.step-pill.done .step-num{background:#1a1a1a;color:#22c55e}input::placeholder{color:#2a2a2a!important}input[type=range]{-webkit-appearance:none;height:3px;background:#1e1e1e;border-radius:4px;outline:none;width:100%}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#ff4444;border-radius:50%;cursor:pointer}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.2)}.dark-input{background:#0a0a0a!important;border:1px solid #1e1e1e!important;border-radius:10px!important;color:#e0e0e0!important;font-family:'DM Sans',sans-serif!important;font-size:.88rem!important;padding:.65rem .9rem!important;outline:none!important;width:100%}.dark-input:focus{border-color:#ff4444!important}.dark-card{background:#0f0f0f;border:1px solid #1a1a1a;border-radius:16px;padding:1.75rem}.dark-label{display:block;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#444;margin-bottom:.4rem}.btn-red{background:#ff4444;border:none;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:.88rem;padding:.8rem 1.5rem;border-radius:12px;cursor:pointer;letter-spacing:.02em;width:100%;margin-top:1rem}.btn-red:disabled{opacity:.25;cursor:not-allowed}.btn-ghost{background:transparent;border:1px solid #1e1e1e;color:#555;font-family:'DM Sans',sans-serif;font-size:.85rem;padding:.7rem 1.2rem;border-radius:10px;cursor:pointer}.ev-btn{width:100%;text-align:left;padding:8px 12px;font-size:.8rem;border:none;border-bottom:1px solid #141414;background:transparent;color:#555;cursor:pointer;font-family:'DM Sans',sans-serif}.ev-btn:hover{background:#141414;color:#ddd}.ev-btn.sel{background:rgba(255,68,68,.08);color:#ff4444;font-weight:600}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#222;border-radius:4px}`}</style>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6" style={{paddingTop:"1.5rem"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,40,40,.1)",border:"1px solid rgba(255,40,40,.2)",color:"#ff4444",fontSize:10,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",padding:"4px 12px",borderRadius:100,marginBottom:"1rem"}}>
            <span style={{width:6,height:6,background:"#ff4444",borderRadius:"50%",display:"inline-block"}} />
            Outil d&apos;analyse
          </div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(1.8rem,4vw,2.4rem)",fontWeight:800,letterSpacing:"-.02em",color:"#fff",marginBottom:".4rem",lineHeight:1.05}}>
            YouTube <span style={{color:"#ff4444"}}>CTA</span> Tracker
          </h1>
          <p style={{fontSize:".88rem",color:"#444"}}>Mesure l&apos;efficacité de tes CTAs YouTube sur tes features produit</p>
        </div>

        <div style={{display:"flex",borderBottom:"1px solid #1a1a1a",marginBottom:"1.5rem"}}>
          {["Vidéo","Feature","Résultats"].map((s,i) => (
            <div key={i} className={`step-pill${i+1===step?" active":i+1<step?" done":""}`} style={{flex:1}}>
              <span className="step-num">{i+1 < step ? "✓" : i+1}</span>
              <span className="hidden sm:inline">{s}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{background:"rgba(255,68,68,.07)",border:"1px solid rgba(255,68,68,.2)",borderRadius:10,padding:".75rem 1rem",marginBottom:"1rem",fontSize:".83rem",color:"#ff6666",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{background:"none",border:"none",color:"#ff4444",cursor:"pointer",fontSize:"1rem",fontWeight:700}}>✕</button>
          </div>
        )}
        {loading && (
          <div style={{display:"flex",alignItems:"center",gap:12,padding:".75rem 0",marginBottom:".5rem"}}>
            <div style={{width:14,height:14,border:"2px solid #333",borderTopColor:"#ff4444",borderRadius:"50%"}} className="animate-spin" />
            <span style={{fontSize:".82rem",color:"#555"}}>{loadingMsg}</span>
          </div>
        )}

        {step === 1 && !loading && (
          <div className="dark-card">
            <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",color:"#fff",marginBottom:"1.25rem"}}>Informations vidéo</h2>
            <div className="space-y-3">
              <div>
                <label className="dark-label">Lien YouTube</label>
                <div className="flex gap-2">
                  <input type="url" value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setVideoFetched(false); }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="dark-input" style={{flex:1}} />
                  <button onClick={fetchVideoInfo} disabled={!videoId || fetchingVideo}
                    style={{background:"#ff4444",border:"none",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:".82rem",padding:"0 1.1rem",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:6,opacity:(!videoId||fetchingVideo)?.3:1}}>
                    {fetchingVideo ? <><div style={{width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%"}} className="animate-spin"/><span>Chargement...</span></> : "▶ Récupérer"}
                  </button>
                </div>
              </div>
              {videoId && videoFetched && (
                <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="Thumbnail" style={{width:"100%",borderRadius:10,border:"1px solid #1a1a1a",display:"block"}} />
              )}
              <div>
                <label className="dark-label">Titre {videoFetched && videoTitle && <span style={{color:"#22c55e",fontSize:10,fontWeight:700,background:"rgba(34,197,94,.1)",borderRadius:4,padding:"1px 6px",marginLeft:4}}>✓ AUTO</span>}</label>
                <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Titre de la vidéo" className="dark-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="dark-label">Publication {videoFetched && pubDate && <span style={{color:"#22c55e",fontSize:10}}>✓</span>}</label>
                  <input type="date" value={pubDate} onChange={e => setPubDate(e.target.value)} className="dark-input" />
                </div>
                <div>
                  <label className="dark-label">Vues {videoFetched && totalViews && <span style={{color:"#22c55e",fontSize:10}}>✓</span>}</label>
                  <input type="number" value={totalViews} onChange={e => setTotalViews(e.target.value)} placeholder="15000" className="dark-input" />
                </div>
              </div>
              <div>
                <label className="dark-label">% rétention au moment du CTA</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={retentionPct} onChange={e => setRetentionPct(e.target.value)} style={{flex:1}} />
                  <div style={{display:"flex",alignItems:"center",gap:4,background:"#0a0a0a",border:"1px solid #1e1e1e",borderRadius:8,padding:"4px 8px"}}>
                    <input type="number" min="0" max="100" value={retentionPct} onChange={e => setRetentionPct(e.target.value)}
                      style={{width:32,background:"transparent",border:"none",color:"#ff4444",fontWeight:700,fontSize:".9rem",textAlign:"center",outline:"none",fontFamily:"'DM Sans',sans-serif"}} />
                    <span style={{color:"#444",fontSize:".85rem"}}>%</span>
                  </div>
                </div>
                <p style={{fontSize:".7rem",color:"#2e2e2e",marginTop:".4rem"}}>→ YouTube Studio → Analytics → Rétention d&apos;audience</p>
              </div>
              <button onClick={() => setStep(2)} disabled={!videoTitle || !pubDate || !totalViews} className="btn-red">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === 2 && !loading && (
          <div className="dark-card">
            <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",color:"#fff",marginBottom:".4rem"}}>Mapping CTA → Feature</h2>
            <p style={{fontSize:".75rem",color:"#333",marginBottom:"1.25rem",fontFamily:"monospace"}}>{videoTitle} · {parseInt(totalViews).toLocaleString()} vues</p>
            <div className="space-y-3">
              <div>
                <label className="dark-label">Event Amplitude <span style={{color:"#ff4444",fontWeight:500,textTransform:"none",letterSpacing:0}}>({AMP_EVENTS.length} events)</span></label>
                <div className="space-y-2">
                  <input type="text" value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Rechercher un event..." className="dark-input" />
                  <div style={{border:"1px solid #1a1a1a",borderRadius:10,overflow:"hidden"}}>
                    <div style={{maxHeight:200,overflowY:"auto"}}>
                      {filteredEvents.length === 0
                        ? <div style={{padding:"10px 12px",fontSize:".8rem",color:"#333"}}>Aucun event trouvé</div>
                        : filteredEvents.map((ev, i) => (
                          <button key={i} onClick={() => { setSelectedEvent(ev); setCustomEvent(""); }}
                            className={`ev-btn${selectedEvent === ev ? " sel" : ""}`}>
                            {ev}
                          </button>
                        ))}
                    </div>
                    <button onClick={() => setSelectedEvent("__custom")}
                      className={`ev-btn${selectedEvent === "__custom" ? " sel" : ""}`}
                      style={{borderTop:"1px solid #1a1a1a",fontSize:".75rem"}}>
                      ✏️ Saisir manuellement
                    </button>
                  </div>
                  {selectedEvent && selectedEvent !== "__custom" && (
                    <p style={{fontSize:".75rem",color:"#ff4444",background:"rgba(255,68,68,.06)",borderRadius:6,padding:"5px 10px",fontFamily:"monospace"}}>✓ {selectedEvent}</p>
                  )}
                  {selectedEvent === "__custom" && (
                    <input type="text" value={customEvent} onChange={e => setCustomEvent(e.target.value)} placeholder="Nom exact de l'event" className="dark-input" />
                  )}
                </div>
              </div>
              <div>
                <label className="dark-label">Description du CTA</label>
                <input type="text" value={ctaDescription} onChange={e => setCtaDescription(e.target.value)} placeholder="Ex: Essayez l'export PDF gratuitement" className="dark-input" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setStep(1)} className="btn-ghost">← Retour</button>
                <button onClick={analyzeImpact} disabled={!activeEvent}
                  style={{flex:1,background:"#ff4444",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:".88rem",padding:".8rem",borderRadius:12,cursor:"pointer",opacity:!activeEvent?.25:1}}>
                  🔍 Analyser l&apos;impact
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && results && !loading && (
          <div className="space-y-4">
            <div className="dark-card">
              <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",color:"#fff",marginBottom:".3rem"}}>Résultats — {videoTitle}</h2>
              <p style={{fontSize:".72rem",color:"#333",marginBottom:"1.25rem",fontFamily:"monospace"}}>Event: {results.eventName} · Publié le {pubDate} · 3j post-publication</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                <MetricBox label="Vues au CTA" value={(results.viewsAtCTA || 0).toLocaleString()} sub={retentionPct + "% de " + parseInt(totalViews).toLocaleString()} color="blue" />
                <MetricBox label="J+1 events" value={(results.j1?.total_events || 0).toLocaleString()} sub={"uplift " + (results.j1?.uplift > 0 ? "+" : "") + results.j1?.uplift + "%"} color={results.j1?.uplift > 0 ? "green" : "orange"} />
                <MetricBox label="Conversion" value={results.conversionRate + "%"} sub="users / vues CTA" color="green" />
                <MetricBox label="Uplift J+3" value={(results.uplift > 0 ? "+" : "") + results.uplift + "%"} sub={results.baselineAvgDaily + "/j → " + results.postAvgDaily + "/j"} color={results.uplift > 0 ? "green" : "orange"} />
                <MetricBox label="Users post-vidéo" value={(results.post_video?.unique_users || 0).toLocaleString()} sub="3 jours" color="purple" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{title:"Baseline (7j avant)",data:results.baseline?.daily,total:results.baseline?.total_events},{title:"Post-vidéo (3j)",data:results.post_video?.daily,total:results.post_video?.total_events}].map((s,idx)=>(
                  <div key={idx}>
                    <h3 style={{fontSize:".7rem",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#333",marginBottom:".6rem"}}>{s.title}</h3>
                    <div className="space-y-1">
                      {(s.data || []).map((d: any, i: number) => (
                        <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:".78rem"}}>
                          <span style={{color:"#444"}}>{d.date}</span>
                          <span style={{fontFamily:"monospace",color:"#888"}}>{d.count}</span>
                        </div>
                      ))}
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:".78rem",fontWeight:700,borderTop:"1px solid #1a1a1a",paddingTop:6,marginTop:4}}>
                        <span style={{color:"#555"}}>Total</span>
                        <span style={{fontFamily:"monospace",color:"#e0e0e0"}}>{s.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {results._debug && (
                <details className="mt-3 text-xs">
                  <summary style={{cursor:"pointer",color:"#f97316",fontWeight:600,fontSize:".75rem"}}>⚠️ Données à 0 — réponse brute</summary>
                  <pre style={{marginTop:8,background:"#0a0a0a",borderRadius:8,padding:10,overflowX:"auto",maxHeight:180,fontSize:".7rem",color:"#444",whiteSpace:"pre-wrap"}}>{JSON.stringify(results._debug, null, 2)}</pre>
                </details>
              )}
              <ImpactChart baseline={results.baseline} postVideo={results.post_video} pubDate={pubDate} />
              <div style={{marginTop:"1.25rem",background:"rgba(255,68,68,.05)",border:"1px solid rgba(255,68,68,.15)",borderRadius:12,padding:"1rem"}}>
                <h3 style={{fontSize:".7rem",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#ff4444",marginBottom:".4rem"}}>Interprétation</h3>
                <p style={{fontSize:".82rem",color:"#555",lineHeight:1.6}}>
                  {results.uplift > 20 ? `Fort impact ! Usage en hausse de ${results.uplift}% après la vidéo.`
                    : results.uplift > 5 ? `Impact modéré (${results.uplift}%). Effet positif mais optimisable.`
                    : results.uplift > 0 ? `Impact faible (${results.uplift}%). CTA à repositionner.`
                    : `Pas d'impact détecté (${results.uplift}%). Reconsidère le placement.`}
                  {" "}Conversion brute : {results.conversionRate}% des viewers au CTA ont activé la feature.
                </p>
              </div>
            </div>
            <button onClick={resetAll} style={{width:"100%",background:"#111",border:"1px solid #1a1a1a",color:"#444",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:".85rem",padding:".8rem",borderRadius:12,cursor:"pointer"}}>
              + Analyser un autre CTA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
