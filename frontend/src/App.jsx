import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Routes, Route } from "react-router-dom";
import PlantList from "./components/PlantList";
import PlantForm from "./components/PlantForm";
import PlantInfo from "./components/PlantInfo";
import PlantsPage from "./pages/PlantsPage";
import "./styles/dark.css";

function App() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // initialize from localStorage so login persists across pages/refresh
  useEffect(() => {
    try {
      const stored = localStorage.getItem("appPassword");
      if (stored) {
        setPassword(stored);
        setIsAuthorized(true);
        setRememberMe(true);
        // set axios default header for convenience
        axios.defaults.headers.common['x-app-password'] = stored;
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogin = () => {
    if (password) {
      setIsAuthorized(true);
      // if user opted to remember, persist; otherwise keep in-memory only
      try { if (rememberMe) localStorage.setItem("appPassword", password); } catch (e) {}
      // set axios default header globally for this session
      axios.defaults.headers.common['x-app-password'] = password;
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword("");
    setRememberMe(false);
    try { localStorage.removeItem("appPassword"); } catch (e) {}
    try { delete axios.defaults.headers.common['x-app-password']; } catch(e) {}
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-6 border rounded shadow">
          <h2 className="mb-4 text-lg font-bold">Enter App Password</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full mb-4"
          />
          <label className="flex items-center mb-4 text-sm">
            <input type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} className="mr-2" />
            Remember me
          </label>
          <button
            onClick={handleLogin}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Login
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-neutral-900 to-black text-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">🌿 Plant Watering Tracker</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdd((s) => !s)}
              className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md font-semibold"
            >
              {showAdd ? "Close" : "Add Plant"}
            </button>
            {isAuthorized && (
              <button onClick={handleLogout} className="px-3 py-2 border rounded text-sm">Logout</button>
            )}
          </div>
        </header>

        <nav className="mb-4">
          <ul className="flex items-center gap-3 text-sm">
            <li><Link to="/" className="text-gray-300 hover:text-white">Home</Link></li>
            <li><Link to="/plants" className="text-gray-300 hover:text-white">Plants</Link></li>
            {/* Rooms are deprecated: use single blueprint in Plants view */}
          </ul>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {showAdd && (
                    <aside className="lg:col-span-1 bg-gray-800 p-4 rounded-lg shadow-md">
                      <PlantForm password={password} />
                    </aside>
                  )}
                  <main className={`${showAdd ? "lg:col-span-2" : "lg:col-span-3"}`}>
                    <PlantList password={password} />
                  </main>
                </div>
              </>
            }
          />
          <Route path="/plants/:id" element={<PlantInfo password={password} />} />
          <Route path="/plants" element={<PlantsPage password={password} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
