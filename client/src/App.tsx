import { Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import LakeDetail from "./pages/LakeDetail";
import Simulation from "./pages/Simulation";
import ActionPlan from "./pages/ActionPlan";
import RegionalCommand from "./pages/RegionalCommand";
import RegionalOptimizer from "./pages/RegionalOptimizer";
import TimeMachinePage from "./pages/TimeMachinePage";
import CascadeNetworkPage from "./pages/CascadeNetworkPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <>
              <Nav />
              <Dashboard />
            </>
          }
        />
        <Route
          path="/lakes/:id"
          element={
            <>
              <Nav />
              <LakeDetail />
            </>
          }
        />
        <Route
          path="/lakes/:id/simulate"
          element={
            <>
              <Nav />
              <Simulation />
            </>
          }
        />
        <Route
          path="/lakes/:id/action-plan"
          element={
            <>
              <Nav />
              <ActionPlan />
            </>
          }
        />
        <Route
          path="/regional"
          element={
            <>
              <Nav />
              <RegionalCommand />
            </>
          }
        />
        <Route
          path="/regional/optimize"
          element={
            <>
              <Nav />
              <RegionalOptimizer />
            </>
          }
        />
        <Route
          path="/timemachine"
          element={
            <>
              <Nav />
              <TimeMachinePage />
            </>
          }
        />
        <Route
          path="/cascade"
          element={
            <>
              <Nav />
              <CascadeNetworkPage />
            </>
          }
        />
      </Routes>
    </div>
  );
}

function Nav() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-panelBorder bg-abyss/90 px-6 py-3 backdrop-blur">
      <Link to="/dashboard" className="font-mono text-sm font-semibold tracking-wide text-waterblue">
        AQUAGUARD AI
      </Link>
      <div className="flex flex-wrap gap-4 text-xs">
        <Link to="/dashboard" className="text-mist hover:text-waterblue">
          Command Center
        </Link>
        <Link to="/regional" className="text-mist hover:text-waterblue">
          🌍 Regional What-If
        </Link>
        <Link to="/regional/optimize" className="text-mist hover:text-waterblue">
          💰 Budget Optimizer
        </Link>
        <Link to="/cascade" className="text-mist hover:text-waterblue">
          🕸️ Cascade Network
        </Link>
        <Link to="/timemachine" className="text-mist hover:text-waterblue">
          ⏳ Time Machine
        </Link>
      </div>
    </div>
  );
}
