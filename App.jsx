import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, PolarAngleAxis, LabelList
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, Plus, Trash2, RefreshCw,
  Save, Sparkles, X, Banknote, PiggyBank, CreditCard, Landmark, ShieldCheck,
  Home, Coins, Gem, Bitcoin, Boxes, Building2, GraduationCap, Layers, ChevronDown
} from "lucide-react";

/* ----------------------------- constants ----------------------------- */

const INCOME_CATS = ["Salary", "Side Income", "Rental", "Freelance", "Other"];
const EXPENSE_CATS = ["Housing", "Essentials", "Debt", "Lifestyle", "Investments", "Other"];
const ASSET_CATS = ["Cash", "Equity", "Gold", "Real Estate", "Crypto", "Other"];
const LIABILITY_CATS = ["Home Loan", "Personal Loan", "Credit Card", "Education Loan", "Other"];

const PINE = "#1A3B2B";
const PINE_LIGHT = "#2E5A42";
const TERRACOTTA = "#C15B3E";
const AMBER = "#C79A3F";
const SAGE = "#94A88C";
const OFFWHITE = "#F7F7F4";
const INK = "#1B2320";

const ASSET_COLORS = { Cash: PINE, Equity: PINE_LIGHT, Gold: AMBER, "Real Estate": "#7C6A46", Crypto: TERRACOTTA, Other: SAGE };
const EXPENSE_COLORS = { Housing: PINE, Essentials: PINE_LIGHT, Debt: TERRACOTTA, Lifestyle: AMBER, Investments: SAGE, Other: "#8A8578" };

const ASSET_ICONS = { Cash: Banknote, Equity: TrendingUp, Gold: Coins, "Real Estate": Home, Crypto: Bitcoin, Other: Boxes };
const LIABILITY_ICONS = { "Home Loan": Building2, "Personal Loan": Landmark, "Credit Card": CreditCard, "Education Loan": GraduationCap, Other: Boxes };

const STORAGE_KEY = "personal-cfo-data-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------------------------ helpers ------------------------------- */

function formatINR(num, compact = false) {
  const n = Math.round(Number(num) || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1e7) return sign + "₹" + trimZero((abs / 1e7).toFixed(2)) + "Cr";
    if (abs >= 1e5) return sign + "₹" + trimZero((abs / 1e5).toFixed(2)) + "L";
    if (abs >= 1e3) return sign + "₹" + trimZero((abs / 1e3).toFixed(1)) + "K";
    return sign + "₹" + abs;
  }
  const str = String(abs);
  let last3 = str.substring(str.length - 3);
  let other = str.substring(0, str.length - 3);
  if (other !== "") last3 = "," + last3;
  const formattedOther = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return sign + "₹" + formattedOther + last3;
}
function trimZero(s) { return s.replace(/\.?0+$/, ""); }

function sum(arr) { return arr.reduce((a, r) => a + (Number(r.amount) || 0), 0); }

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function seedData() {
  return {
    income: [
      { id: uid(), label: "Monthly Salary", category: "Salary", amount: 95000 },
      { id: uid(), label: "Freelance Design", category: "Side Income", amount: 12000 },
    ],
    expenses: [
      { id: uid(), label: "Rent", category: "Housing", amount: 25000 },
      { id: uid(), label: "Groceries & Utilities", category: "Essentials", amount: 14000 },
      { id: uid(), label: "Credit Card EMI", category: "Debt", amount: 9000 },
      { id: uid(), label: "Dining & Shopping", category: "Lifestyle", amount: 16000 },
      { id: uid(), label: "SIP - Index Fund", category: "Investments", amount: 8000 },
    ],
    assets: [
      { id: uid(), label: "Savings Account", category: "Cash", amount: 180000 },
      { id: uid(), label: "Mutual Funds", category: "Equity", amount: 220000 },
      { id: uid(), label: "Gold Jewellery", category: "Gold", amount: 90000 },
    ],
    liabilities: [
      { id: uid(), label: "Credit Card Outstanding", category: "Credit Card", amount: 45000 },
      { id: uid(), label: "Bike Loan", category: "Personal Loan", amount: 60000 },
    ],
    netWorthHistory: [
      { date: monthsAgoLabel(4), netWorth: 285000 },
      { date: monthsAgoLabel(3), netWorth: 312000 },
      { date: monthsAgoLabel(2), netWorth: 340000 },
      { date: monthsAgoLabel(1), netWorth: 368000 },
    ],
    aiInsight: null,
  };
}
function monthsAgoLabel(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toLocaleString("en-IN", { month: "short" });
}

/* ------------------------------ toasts -------------------------------- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = "default") => {
    const id = uid();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} className="cfo-toast" style={{
          background: t.tone === "error" ? TERRACOTTA : PINE,
          color: OFFWHITE,
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- gauge --------------------------------- */

function ScoreGauge({ score }) {
  const tone = score >= 70 ? PINE : score >= 45 ? AMBER : TERRACOTTA;
  const data = [{ name: "score", value: score, fill: tone }];
  return (
    <div style={{ position: "relative", width: "100%", height: 176 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%" outerRadius="100%" data={data} startAngle={210} endAngle={-30}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "#E4E2DA" }} dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 14 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 40, fontWeight: 700, color: INK, lineHeight: 1 }}>{Math.round(score)}</span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.06em", color: "#6B6A60", textTransform: "uppercase", marginTop: 4 }}>out of 100</span>
      </div>
    </div>
  );
}

/* --------------------------- small UI atoms ----------------------------- */

function Btn({ children, onClick, variant = "primary", icon: Icon, testId, disabled }) {
  const styles = {
    primary: { background: PINE, color: OFFWHITE, border: `1px solid ${PINE}` },
    ghost: { background: "transparent", color: PINE, border: `1px solid ${PINE}` },
    destructive: { background: "transparent", color: TERRACOTTA, border: `1px solid ${TERRACOTTA}` },
    dark: { background: OFFWHITE, color: PINE, border: `1px solid ${OFFWHITE}` },
  };
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className="cfo-btn"
      style={{ ...styles[variant], opacity: disabled ? 0.55 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {Icon && <Icon size={15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function KpiCard({ label, value, sub, tone, testId }) {
  const toneColor = tone === "good" ? PINE : tone === "warn" ? AMBER : tone === "bad" ? TERRACOTTA : INK;
  return (
    <div className="cfo-card cfo-kpi" data-testid={testId}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="cfo-eyebrow">{label}</span>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: toneColor }} />
      </div>
      <span className="cfo-mono" style={{ fontSize: 26, fontWeight: 700, color: toneColor, marginTop: 6 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#6B6A60", marginTop: 2 }}>{sub}</span>}
    </div>
  );
}

/* --------------------------- drawer / sheet ----------------------------- */

function Drawer({ open, onClose, title, rows, categories, onAdd, onDelete, onChange, testPrefix }) {
  if (!open) return null;
  const total = sum(rows);
  return (
    <div className="cfo-drawer-overlay" onClick={onClose}>
      <div className="cfo-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E4E2DA" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: INK, margin: 0 }}>{title}</h3>
          <button data-testid={`${testPrefix}-close`} onClick={onClose} className="cfo-icon-btn"><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.length === 0 && (
            <p style={{ color: "#8A8578", fontSize: 14, marginTop: 20 }}>No entries yet. Add your first row below.</p>
          )}
          {rows.map((row) => (
            <div key={row.id} className="cfo-row" data-testid={`${testPrefix}-row`}>
              <input
                className="cfo-input"
                data-testid={`${testPrefix}-label-input`}
                value={row.label}
                placeholder="Label"
                onChange={(e) => onChange(row.id, { label: e.target.value })}
                style={{ flex: "1.4" }}
              />
              <div className="cfo-select-wrap" style={{ flex: 1 }}>
                <select
                  className="cfo-select"
                  data-testid={`${testPrefix}-category-select`}
                  value={row.category}
                  onChange={(e) => onChange(row.id, { category: e.target.value })}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#8A8578" }} />
              </div>
              <input
                className="cfo-input cfo-mono"
                data-testid={`${testPrefix}-amount-input`}
                type="number"
                value={row.amount}
                placeholder="0"
                onChange={(e) => onChange(row.id, { amount: e.target.value })}
                style={{ flex: 0.9, textAlign: "right" }}
              />
              <button data-testid={`${testPrefix}-delete-row`} onClick={() => onDelete(row.id)} className="cfo-icon-btn" style={{ color: TERRACOTTA }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button data-testid={`${testPrefix}-add-row`} onClick={onAdd} className="cfo-add-row">
            <Plus size={15} /> Add row
          </button>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E4E2DA", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FBFBF9" }}>
          <span style={{ fontSize: 13, color: "#6B6A60" }}>Running total</span>
          <span className="cfo-mono" style={{ fontSize: 18, fontWeight: 700, color: INK }}>{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- app ---------------------------------- */

export default function PersonalCFO() {
  const [data, setData] = useState(seedData());
  const [loaded, setLoaded] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(null); // 'income' | 'expenses' | 'assets' | 'liabilities' | null
  const [aiLoading, setAiLoading] = useState(false);
  const { toasts, push } = useToasts();
  const saveTimer = useRef(null);

  // load persisted data once (browser localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData((d) => ({ ...d, ...parsed }));
      }
    } catch (e) {
      // no saved data yet — keep seed
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        push("Couldn't save — try again", "error");
      }
    }, 400);
  }, [push]);

  useEffect(() => {
    if (loaded) persist(data);
  }, [data, loaded, persist]);

  /* ------------------------ row mutation helpers ------------------------ */

  function addRow(section, categories) {
    setData((d) => ({ ...d, [section]: [...d[section], { id: uid(), label: "", category: categories[0], amount: 0 }] }));
  }
  function deleteRow(section, id) {
    setData((d) => ({ ...d, [section]: d[section].filter((r) => r.id !== id) }));
  }
  function changeRow(section, id, patch) {
    setData((d) => ({ ...d, [section]: d[section].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  /* ------------------------------ metrics -------------------------------- */

  const metrics = useMemo(() => {
    const incomeTotal = sum(data.income);
    const expenseTotal = sum(data.expenses);
    const assetTotal = sum(data.assets);
    const liabilityTotal = sum(data.liabilities);
    const netWorth = assetTotal - liabilityTotal;
    const surplus = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? (surplus / incomeTotal) * 100 : 0;
    const burnRate = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : 0;
    const cashRow = data.assets.filter((r) => r.category === "Cash");
    const liquidCash = sum(cashRow);
    const essentialExpenses = sum(data.expenses.filter((r) => ["Housing", "Essentials", "Debt"].includes(r.category)));
    const runway = essentialExpenses > 0 ? liquidCash / essentialExpenses : liquidCash > 0 ? 99 : 0;
    const dti = incomeTotal > 0 ? liabilityTotal / (incomeTotal * 12) : liabilityTotal > 0 ? 1 : 0;
    const investmentSpend = sum(data.expenses.filter((r) => r.category === "Investments"));
    const lifestyleSpend = sum(data.expenses.filter((r) => r.category === "Lifestyle"));
    const assetCatsUsed = new Set(data.assets.map((r) => r.category)).size;

    const savingsScore = clamp((savingsRate / 40) * 100, 0, 100);
    const runwayScore = clamp((runway / 6) * 100, 0, 100);
    const debtScore = clamp(100 - dti * 100, 0, 100);
    const netWorthScore = netWorth > 0 ? 100 : netWorth === 0 ? 40 : 0;
    const diversificationScore = clamp((assetCatsUsed / 6) * 100, 0, 100);
    const wealthScore =
      savingsScore * 0.3 + runwayScore * 0.2 + debtScore * 0.2 + netWorthScore * 0.15 + diversificationScore * 0.15;

    const history = data.netWorthHistory;
    const prevNetWorth = history.length ? history[history.length - 1].netWorth : null;
    const prevIncome = history.length >= 2 ? true : false;

    const redFlags = [];
    if (prevNetWorth !== null && incomeTotal > 0 && Math.abs(netWorth - prevNetWorth) < prevNetWorth * 0.01 && incomeTotal > 0) {
      // flat net worth vs last snapshot despite income existing
      redFlags.push("Income steady but net worth hasn't moved since last snapshot — money is coming in but not sticking.");
    }
    if (history.length >= 2) {
      const growthAssets = assetTotal;
      const growthDebt = liabilityTotal;
      if (growthDebt > 0 && growthAssets > 0 && liabilityTotal / (assetTotal || 1) > 0.5) {
        redFlags.push("Assets are growing, but liabilities are climbing right alongside them.");
      }
    }
    if (investmentSpend > 0 && runway < 3) {
      redFlags.push("SIPs are running but the emergency fund covers less than 3 months — build the cushion first.");
    }
    if (lifestyleSpend > investmentSpend) {
      redFlags.push("Lifestyle spending is outpacing investments this month.");
    }
    if (dti > 0.5) {
      redFlags.push("Debt-to-income ratio has crossed 50% — liabilities are getting heavy relative to annual income.");
    }
    if (burnRate > 90) {
      redFlags.push("Burn rate is above 90% of income — almost nothing left after expenses.");
    }
    if (surplus < 0) {
      redFlags.push("Monthly surplus is negative — expenses exceed income this month.");
    }

    let ruleVerdict = "SALARY_ROTATING";
    if (savingsRate >= 20 && netWorth > 0 && dti <= 0.3 && surplus > 0) ruleVerdict = "WEALTH_BUILDING";
    else if (burnRate > 90 || surplus < 0 || dti > 0.5) ruleVerdict = "WEALTH_LEAKING";

    return {
      incomeTotal, expenseTotal, assetTotal, liabilityTotal, netWorth, surplus,
      savingsRate, burnRate, runway, dti, wealthScore, redFlags, ruleVerdict,
      liquidCash, essentialExpenses,
    };
  }, [data]);

  /* ------------------------------ chart data ------------------------------ */

  const trendData = useMemo(() => {
    const hist = data.netWorthHistory.map((h) => ({ date: h.date, netWorth: h.netWorth }));
    return [...hist, { date: "Now", netWorth: metrics.netWorth }];
  }, [data.netWorthHistory, metrics.netWorth]);

  const allocationData = useMemo(() => {
    const byCategory = {};
    data.assets.forEach((r) => { byCategory[r.category] = (byCategory[r.category] || 0) + (Number(r.amount) || 0); });
    return Object.entries(byCategory).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [data.assets]);

  const cashFlowData = useMemo(() => ([
    { name: "Income", value: metrics.incomeTotal, fill: PINE },
    { name: "Expenses", value: metrics.expenseTotal, fill: TERRACOTTA },
    { name: "Surplus", value: Math.max(metrics.surplus, 0), fill: metrics.surplus >= 0 ? SAGE : TERRACOTTA },
  ]), [metrics]);

  const expenseBreakdown = useMemo(() => {
    const byCategory = {};
    data.expenses.forEach((r) => { byCategory[r.category] = (byCategory[r.category] || 0) + (Number(r.amount) || 0); });
    return Object.entries(byCategory)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.expenses]);

  /* -------------------------------- actions -------------------------------- */

  function saveSnapshot() {
    setData((d) => ({
      ...d,
      netWorthHistory: [...d.netWorthHistory, { date: new Date().toLocaleString("en-IN", { month: "short", day: "numeric" }), netWorth: metrics.netWorth }].slice(-12),
    }));
    push("Monthly snapshot saved");
  }

  function resetAll() {
    const empty = { income: [], expenses: [], assets: [], liabilities: [], netWorthHistory: [], aiInsight: null };
    setData(empty);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(empty)); } catch (e) {}
    push("Dashboard reset — starting fresh");
  }

  async function generateInsights() {
    setAiLoading(true);
    try {
      const snapshot = {
        income: data.income, expenses: data.expenses, assets: data.assets, liabilities: data.liabilities,
        netWorth: metrics.netWorth, surplus: metrics.surplus, savingsRate: metrics.savingsRate.toFixed(1),
        burnRate: metrics.burnRate.toFixed(1), runwayMonths: metrics.runway.toFixed(1),
        debtToIncomeRatio: (metrics.dti * 100).toFixed(1), wealthHealthScore: Math.round(metrics.wealthScore),
        redFlags: metrics.redFlags,
      };
      // Calls our own serverless function (api/insights.js), which holds the
      // Anthropic API key server-side and forwards the request to Claude.
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) throw new Error("Request failed");
      const parsed = await response.json();
      setData((d) => ({ ...d, aiInsight: parsed }));
      push("AI insights generated");
    } catch (e) {
      push("Couldn't reach the AI CFO — try again", "error");
    } finally {
      setAiLoading(false);
    }
  }

  /* -------------------------------- derived ui -------------------------------- */

  const verdict = data.aiInsight?.verdict || metrics.ruleVerdict;
  const verdictMeta = {
    WEALTH_BUILDING: { label: "Wealth Building", color: PINE },
    WEALTH_LEAKING: { label: "Wealth Leaking", color: TERRACOTTA },
    SALARY_ROTATING: { label: "Salary Rotating", color: AMBER },
  }[verdict];

  const tone = (val, good, warn) => (val >= good ? "good" : val >= warn ? "warn" : "bad");
  const toneInv = (val, good, warn) => (val <= good ? "good" : val <= warn ? "warn" : "bad"); // lower is better

  return (
    <div className="cfo-root">
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,500,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .cfo-root {
          --font-display: 'Cabinet Grotesk', 'Manrope', sans-serif;
          --font-body: 'Manrope', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          font-family: var(--font-body);
          background: ${OFFWHITE};
          color: ${INK};
          min-height: 100%;
          position: relative;
          padding-bottom: 40px;
        }
        .cfo-root::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          opacity: 0.045; mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .cfo-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
        .cfo-eyebrow { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6B6A60; font-weight: 600; }

        .cfo-header {
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          background: rgba(247,247,244,0.78);
          border-bottom: 1px solid #E4E2DA;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 28px;
        }
        .cfo-brand { display: flex; align-items: center; gap: 10px; }
        .cfo-brand-mark {
          width: 34px; height: 34px; border-radius: 9px; background: ${PINE};
          display: flex; align-items: center; justify-content: center; color: ${OFFWHITE};
        }
        .cfo-brand-name { font-family: var(--font-display); font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
        .cfo-brand-sub { font-size: 11px; color: #6B6A60; }

        .cfo-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-body); font-size: 13px; font-weight: 600;
          padding: 9px 15px; border-radius: 9px; transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .cfo-btn:hover:not(:disabled) { transform: translateY(-1px); }

        .cfo-icon-btn {
          background: transparent; border: none; color: #6B6A60; cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 6px;
        }
        .cfo-icon-btn:hover { background: #ECEBE5; }

        .cfo-shell { max-width: 1440px; margin: 0 auto; padding: 24px 28px 0; position: relative; z-index: 1; }

        .cfo-card {
          background: #FFFFFF; border: 1px solid #E9E7DF; border-radius: 16px; padding: 20px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          animation: cfoFadeIn 0.5s ease both;
        }
        .cfo-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px -18px rgba(26,59,43,0.35); }

        @keyframes cfoFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .cfo-grid { display: grid; gap: 18px; margin-top: 18px; }
        .cfo-grid-hero { grid-template-columns: 2fr 1fr; }
        .cfo-grid-5 { grid-template-columns: repeat(5, 1fr); }
        .cfo-grid-2-1 { grid-template-columns: 2fr 1fr; }
        .cfo-grid-2 { grid-template-columns: 1fr 1fr; }
        @media (max-width: 980px) {
          .cfo-grid-hero, .cfo-grid-5, .cfo-grid-2-1, .cfo-grid-2 { grid-template-columns: 1fr; }
        }

        .cfo-kpi { display: flex; flex-direction: column; }

        .cfo-hero-card {
          background: ${PINE}; color: ${OFFWHITE}; border-radius: 20px; padding: 28px 30px;
          display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;
          animation: cfoFadeIn 0.5s ease both;
        }
        .cfo-hero-card::after {
          content: ""; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 999px;
          background: radial-gradient(circle, rgba(247,247,244,0.10), transparent 70%);
        }

        .cfo-ai-card {
          background: ${PINE}; color: ${OFFWHITE}; border-radius: 20px; padding: 26px 30px; margin-top: 18px;
          animation: cfoFadeIn 0.5s ease both;
        }
        .cfo-badge {
          display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
        }
        .cfo-chip {
          background: rgba(247,247,244,0.10); border: 1px solid rgba(247,247,244,0.22);
          border-radius: 10px; padding: 10px 14px; font-size: 13px; line-height: 1.4;
        }

        .cfo-drawer-overlay {
          position: fixed; inset: 0; background: rgba(20,25,22,0.35); z-index: 100;
          display: flex; justify-content: flex-end; animation: cfoFadeIn 0.2s ease both;
        }
        .cfo-drawer {
          width: min(460px, 92vw); height: 100%; background: ${OFFWHITE}; display: flex; flex-direction: column;
          box-shadow: -18px 0 40px -20px rgba(0,0,0,0.3);
        }
        .cfo-row { display: flex; gap: 8px; align-items: center; }
        .cfo-input {
          font-family: var(--font-body); font-size: 13px; padding: 9px 10px; border-radius: 8px;
          border: 1px solid #DEDCD2; background: #FFFFFF; color: ${INK}; min-width: 0;
        }
        .cfo-input:focus, .cfo-select:focus { outline: 2px solid ${PINE}; outline-offset: 1px; }
        .cfo-select-wrap { position: relative; }
        .cfo-select {
          appearance: none; width: 100%; font-family: var(--font-body); font-size: 13px; padding: 9px 24px 9px 10px;
          border-radius: 8px; border: 1px solid #DEDCD2; background: #FFFFFF; color: ${INK};
        }
        .cfo-add-row {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          border: 1.5px dashed #C7C4B6; border-radius: 10px; padding: 10px; background: transparent;
          color: ${PINE}; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px;
        }
        .cfo-add-row:hover { background: #F0EFE9; }

        .cfo-toast {
          font-family: var(--font-body); font-size: 13px; font-weight: 600; padding: 11px 16px; border-radius: 10px;
          box-shadow: 0 8px 24px -10px rgba(0,0,0,0.35); animation: cfoFadeIn 0.25s ease both;
        }

        .cfo-flag {
          display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px;
          background: #FBF2ED; border: 1px solid #F1D9CC; font-size: 13px; color: #7A3A24;
        }

        .cfo-section-title {
          font-family: var(--font-display); font-size: 15px; font-weight: 700; color: ${INK};
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
        }
      `}</style>

      <ToastStack toasts={toasts} />

      <header className="cfo-header">
        <div className="cfo-brand">
          <div className="cfo-brand-mark"><Wallet size={18} /></div>
          <div>
            <div className="cfo-brand-name">Personal CFO</div>
            <div className="cfo-brand-sub">Wealth diagnosis, not just tracking</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn testId="save-snapshot-button" icon={Save} onClick={saveSnapshot}>Save monthly snapshot</Btn>
          <Btn testId="reset-button" icon={RefreshCw} variant="ghost" onClick={resetAll}>Reset</Btn>
        </div>
      </header>

      <div className="cfo-shell">
        {/* HERO ROW */}
        <div className="cfo-grid cfo-grid-hero" style={{ marginTop: 0 }}>
          <div className="cfo-hero-card" data-testid="net-worth-hero-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
              <div>
                <span className="cfo-eyebrow" style={{ color: "rgba(247,247,244,0.7)" }}>Net Worth</span>
                <div className="cfo-mono" style={{ fontSize: 46, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>
                  {formatINR(metrics.netWorth)}
                </div>
              </div>
              <span className="cfo-badge" style={{ background: "rgba(247,247,244,0.14)", color: OFFWHITE }}>
                {metrics.netWorth >= (data.netWorthHistory[data.netWorthHistory.length - 1]?.netWorth ?? metrics.netWorth) ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {formatINR(metrics.assetTotal, true)} assets · {formatINR(metrics.liabilityTotal, true)} debt
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 20, zIndex: 1 }}>
              <div>
                <span style={{ fontSize: 11, color: "rgba(247,247,244,0.65)" }}>Assets</span>
                <div className="cfo-mono" style={{ fontSize: 18, fontWeight: 600 }}>{formatINR(metrics.assetTotal, true)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "rgba(247,247,244,0.65)" }}>Liabilities</span>
                <div className="cfo-mono" style={{ fontSize: 18, fontWeight: 600 }}>{formatINR(metrics.liabilityTotal, true)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "rgba(247,247,244,0.65)" }}>Verdict</span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{verdictMeta.label}</div>
              </div>
            </div>
          </div>

          <div className="cfo-card" data-testid="wealth-health-score-card">
            <span className="cfo-eyebrow">Wealth Health Score</span>
            <ScoreGauge score={metrics.wealthScore} />
          </div>
        </div>

        {/* AI CFO CARD */}
        <div className="cfo-ai-card" data-testid="ai-cfo-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={18} />
              <span className="cfo-eyebrow" style={{ color: "rgba(247,247,244,0.75)" }}>AI Personal CFO</span>
              <span className="cfo-badge" style={{
                background: verdict === "WEALTH_BUILDING" ? "rgba(148,168,140,0.25)" : verdict === "WEALTH_LEAKING" ? "rgba(193,91,62,0.3)" : "rgba(199,154,63,0.3)",
                color: OFFWHITE,
              }}>{verdictMeta.label}</span>
            </div>
            <Btn testId="generate-ai-insights-button" variant="dark" icon={Sparkles} onClick={generateInsights} disabled={aiLoading}>
              {aiLoading ? "Thinking…" : data.aiInsight ? "Regenerate insights" : "Generate AI Insights"}
            </Btn>
          </div>

          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, maxWidth: 760 }}>
            {data.aiInsight?.summary || "Tap “Generate AI Insights” — your Personal CFO will read this month's numbers and tell you straight: banda wealth bana raha hai, ya sirf salary rotate ho rahi hai."}
          </p>

          {data.aiInsight?.recommendations?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              {data.aiInsight.recommendations.map((r, i) => (
                <span key={i} className="cfo-chip" data-testid="ai-recommendation-chip">{r}</span>
              ))}
            </div>
          )}
        </div>

        {/* KPI BENTO */}
        <div className="cfo-grid cfo-grid-5">
          <KpiCard testId="kpi-surplus" label="Monthly Surplus" value={formatINR(metrics.surplus, true)} tone={metrics.surplus > 0 ? "good" : metrics.surplus === 0 ? "warn" : "bad"} />
          <KpiCard testId="kpi-savings-rate" label="Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`} tone={tone(metrics.savingsRate, 20, 10)} />
          <KpiCard testId="kpi-burn-rate" label="Burn Rate" value={`${metrics.burnRate.toFixed(1)}%`} tone={toneInv(metrics.burnRate, 70, 90)} />
          <KpiCard testId="kpi-runway" label="Emergency Runway" value={`${metrics.runway.toFixed(1)} mo`} tone={tone(metrics.runway, 6, 3)} />
          <KpiCard testId="kpi-dti" label="Debt-to-Income" value={`${(metrics.dti * 100).toFixed(1)}%`} tone={toneInv(metrics.dti * 100, 30, 50)} />
        </div>

        {/* TREND + ALLOCATION */}
        <div className="cfo-grid cfo-grid-2-1">
          <div className="cfo-card" data-testid="net-worth-trend-card">
            <div className="cfo-section-title">Net Worth Trend</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PINE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PINE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#8A8578" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatINR(v, true)} tick={{ fontSize: 11, fill: "#8A8578" }} axisLine={false} tickLine={false} width={64} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E4E2DA", fontFamily: "Manrope" }} />
                <Area type="monotone" dataKey="netWorth" stroke={PINE} strokeWidth={2.5} fill="url(#nwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="cfo-card" data-testid="asset-allocation-card">
            <div className="cfo-section-title">Asset Allocation</div>
            {allocationData.length === 0 ? (
              <p style={{ color: "#8A8578", fontSize: 13 }}>Add assets to see your allocation.</p>
            ) : (
              <>
                <div style={{ position: "relative", height: 170 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                        {allocationData.map((d, i) => <Cell key={i} fill={ASSET_COLORS[d.name] || SAGE} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatINR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span className="cfo-mono" style={{ fontSize: 16, fontWeight: 700 }}>{formatINR(metrics.assetTotal, true)}</span>
                    <span style={{ fontSize: 10, color: "#8A8578" }}>total</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {allocationData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: ASSET_COLORS[d.name] || SAGE }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CASH FLOW + EXPENSE BREAKDOWN */}
        <div className="cfo-grid cfo-grid-2">
          <div className="cfo-card" data-testid="cash-flow-card">
            <div className="cfo-section-title">
              Cash Flow
              <div style={{ display: "flex", gap: 8 }}>
                <button data-testid="open-income-sheet-button" className="cfo-icon-btn" style={{ border: "1px solid #E4E2DA", fontSize: 11, padding: "5px 9px", fontWeight: 600, color: PINE }} onClick={() => setOpenDrawer("income")}>+ Income</button>
                <button data-testid="open-expenses-sheet-button" className="cfo-icon-btn" style={{ border: "1px solid #E4E2DA", fontSize: 11, padding: "5px 9px", fontWeight: 600, color: TERRACOTTA }} onClick={() => setOpenDrawer("expenses")}>+ Expenses</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cashFlowData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8A8578" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatINR(v, true)} tick={{ fontSize: 11, fill: "#8A8578" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E4E2DA", fontFamily: "Manrope" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {cashFlowData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="cfo-card" data-testid="expense-breakdown-card">
            <div className="cfo-section-title">Expense Breakdown</div>
            {expenseBreakdown.length === 0 ? (
              <p style={{ color: "#8A8578", fontSize: 13 }}>Add expenses to see the breakdown.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={expenseBreakdown} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatINR(v, true)} tick={{ fontSize: 11, fill: "#8A8578" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#8A8578" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E4E2DA", fontFamily: "Manrope" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {expenseBreakdown.map((d, i) => <Cell key={i} fill={EXPENSE_COLORS[d.name] || SAGE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ASSETS / LIABILITIES QUICK ACCESS */}
        <div className="cfo-grid cfo-grid-2">
          <div className="cfo-card">
            <div className="cfo-section-title">
              Assets
              <button data-testid="open-assets-sheet-button" className="cfo-icon-btn" style={{ border: "1px solid #E4E2DA", fontSize: 11, padding: "5px 9px", fontWeight: 600, color: PINE }} onClick={() => setOpenDrawer("assets")}>Manage</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.assets.length === 0 && <p style={{ color: "#8A8578", fontSize: 13 }}>No assets recorded yet.</p>}
              {data.assets.map((r) => {
                const Icon = ASSET_ICONS[r.category] || Boxes;
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon size={14} color={PINE} /> {r.label || r.category}</span>
                    <span className="cfo-mono">{formatINR(r.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="cfo-card">
            <div className="cfo-section-title">
              Liabilities
              <button data-testid="open-liabilities-sheet-button" className="cfo-icon-btn" style={{ border: "1px solid #E4E2DA", fontSize: 11, padding: "5px 9px", fontWeight: 600, color: TERRACOTTA }} onClick={() => setOpenDrawer("liabilities")}>Manage</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.liabilities.length === 0 && <p style={{ color: "#8A8578", fontSize: 13 }}>No liabilities recorded yet.</p>}
              {data.liabilities.map((r) => {
                const Icon = LIABILITY_ICONS[r.category] || Boxes;
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon size={14} color={TERRACOTTA} /> {r.label || r.category}</span>
                    <span className="cfo-mono">{formatINR(r.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RED FLAGS */}
        <div className="cfo-card" style={{ marginTop: 18 }} data-testid="red-flags-panel">
          <div className="cfo-section-title">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} color={TERRACOTTA} /> Red Flags</span>
            <span className="cfo-eyebrow">{metrics.redFlags.length} active</span>
          </div>
          {metrics.redFlags.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: PINE, fontSize: 13 }}>
              <ShieldCheck size={16} /> No red flags right now — numbers look clean.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {metrics.redFlags.map((f, i) => (
                <div key={i} className="cfo-flag" data-testid="red-flag-item">
                  <AlertTriangle size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer style={{ textAlign: "center", padding: "28px 0 6px", fontSize: 12, color: "#8A8578" }}>
          All data stored privately for your account. Never shared.
        </footer>
      </div>

      <Drawer
        open={openDrawer === "income"} onClose={() => setOpenDrawer(null)} title="Income" testPrefix="income"
        rows={data.income} categories={INCOME_CATS}
        onAdd={() => addRow("income", INCOME_CATS)} onDelete={(id) => deleteRow("income", id)} onChange={(id, p) => changeRow("income", id, p)}
      />
      <Drawer
        open={openDrawer === "expenses"} onClose={() => setOpenDrawer(null)} title="Expenses" testPrefix="expenses"
        rows={data.expenses} categories={EXPENSE_CATS}
        onAdd={() => addRow("expenses", EXPENSE_CATS)} onDelete={(id) => deleteRow("expenses", id)} onChange={(id, p) => changeRow("expenses", id, p)}
      />
      <Drawer
        open={openDrawer === "assets"} onClose={() => setOpenDrawer(null)} title="Assets" testPrefix="assets"
        rows={data.assets} categories={ASSET_CATS}
        onAdd={() => addRow("assets", ASSET_CATS)} onDelete={(id) => deleteRow("assets", id)} onChange={(id, p) => changeRow("assets", id, p)}
      />
      <Drawer
        open={openDrawer === "liabilities"} onClose={() => setOpenDrawer(null)} title="Liabilities" testPrefix="liabilities"
        rows={data.liabilities} categories={LIABILITY_CATS}
        onAdd={() => addRow("liabilities", LIABILITY_CATS)} onDelete={(id) => deleteRow("liabilities", id)} onChange={(id, p) => changeRow("liabilities", id, p)}
      />
    </div>
  );
}
