"use client"
import { useState, useEffect, Suspense, lazy } from "react"
import { LayoutDashboard, ClipboardCheck, GitCompare, Shield, Calculator, CreditCard, FileText, FolderOpen, Search, Eye, Phone, FileSearch, Lock, Bot, Globe } from "lucide-react"

const DashboardPanel = lazy(() => import("@/components/DashboardPanel").then(m => ({ default: m.DashboardPanel })))
const TreasuryOpsPanel = lazy(() => import("@/components/TreasuryOpsPanel").then(m => ({ default: m.TreasuryOpsPanel })))
const ReconciliationPanel = lazy(() => import("@/components/ReconciliationPanel").then(m => ({ default: m.ReconciliationPanel })))
const RiskDashboardPanel = lazy(() => import("@/components/RiskDashboardPanel").then(m => ({ default: m.RiskDashboardPanel })))
const RiskModelsPanel = lazy(() => import("@/components/RiskModelsPanel").then(m => ({ default: m.RiskModelsPanel })))
const StructuredCreditPanel = lazy(() => import("@/components/StructuredCreditPanel").then(m => ({ default: m.StructuredCreditPanel })))
const TrusteeReportsPanel = lazy(() => import("@/components/TrusteeReportsPanel").then(m => ({ default: m.TrusteeReportsPanel })))
const DealRoomPanel = lazy(() => import("@/components/DealRoomPanel").then(m => ({ default: m.DealRoomPanel })))
const DealSearchPanel = lazy(() => import("@/components/DealSearchPanel").then(m => ({ default: m.DealSearchPanel })))
const CIOViewPanel = lazy(() => import("@/components/CIOViewPanel").then(m => ({ default: m.CIOViewPanel })))
const CallIntelligencePanel = lazy(() => import("@/components/CallIntelligencePanel").then(m => ({ default: m.CallIntelligencePanel })))
const DocumentsPanel = lazy(() => import("@/components/DocumentsPanel").then(m => ({ default: m.DocumentsPanel })))
const GovernancePanel = lazy(() => import("@/components/GovernancePanel").then(m => ({ default: m.GovernancePanel })))
const AgentPanel = lazy(() => import("@/components/AgentPanel").then(m => ({ default: m.AgentPanel })))
const GlobalMapPanel = lazy(() => import("@/components/GlobalMapPanel").then(m => ({ default: m.GlobalMapPanel })))

const NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "treasury-ops", label: "Treasury Ops", icon: ClipboardCheck },
  { id: "reconciliation", label: "Reconciliation", icon: GitCompare },
  { id: "risk", label: "Risk", icon: Shield },
  { id: "risk-models", label: "Models", icon: Calculator },
  { id: "structured-credit", label: "Credit", icon: CreditCard },
  { id: "trustee-reports", label: "Trustee", icon: FileText },
  { id: "deal-room", label: "Deals", icon: FolderOpen },
  { id: "deal-search", label: "Search", icon: Search },
  { id: "cio-view", label: "CIO View", icon: Eye },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "docs", label: "Docs", icon: FileSearch },
  { id: "global-map", label: "Global Map", icon: Globe },
  { id: "governance", label: "Governance", icon: Lock },
  { id: "agent", label: "Agent", icon: Bot },
]

function LoadingSpinner() {
  return <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading...</div>
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }))
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{
        display: "flex", alignItems: "center", gap: 0, padding: "0 20px", height: 56,
        background: "#1e293b", borderBottom: "1px solid #334155",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>L1</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>LetterOne 360</span>
            <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{currentTime}</span>
          </div>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflowX: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 6,
                border: "none",
                background: activeTab === item.id ? "rgba(59, 130, 246, 0.2)" : "transparent",
                color: activeTab === item.id ? "#93c5fd" : "#94a3b8",
                fontSize: 12, fontWeight: activeTab === item.id ? 600 : 500,
                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </nav>
        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap", marginLeft: 12 }}>v2.2</span>
      </header>
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === "dashboard" && <DashboardPanel onNavigate={setActiveTab} />}
          {activeTab === "treasury-ops" && <TreasuryOpsPanel />}
          {activeTab === "reconciliation" && <ReconciliationPanel />}
          {activeTab === "risk" && <RiskDashboardPanel />}
          {activeTab === "risk-models" && <RiskModelsPanel />}
          {activeTab === "structured-credit" && <StructuredCreditPanel />}
          {activeTab === "trustee-reports" && <TrusteeReportsPanel />}
          {activeTab === "deal-room" && <DealRoomPanel />}
          {activeTab === "deal-search" && <DealSearchPanel />}
          {activeTab === "cio-view" && <CIOViewPanel />}
          {activeTab === "calls" && <CallIntelligencePanel />}
          {activeTab === "docs" && <DocumentsPanel />}
          {activeTab === "global-map" && <GlobalMapPanel />}
          {activeTab === "governance" && <GovernancePanel />}
          {activeTab === "agent" && <AgentPanel />}
        </Suspense>
      </main>
    </div>
  )
}
