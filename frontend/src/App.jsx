import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Routes, Route } from "react-router-dom";
import PlantList from "./components/PlantList";
import AddPlant from "./pages/AddPlant";
import PlantInfo from "./components/PlantInfo";
import PlantsPage from "./pages/PlantsPage";
import PositionsPage from "./pages/PositionsPage";
import "./styles/dark.css";

function App() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  // showAdd removed: Add Plant now has its own page
  const [rememberMe, setRememberMe] = useState(false);

  // initialize from localStorage so login persists across pages/refresh
  useEffect(() => {
    const stored = localStorage.getItem("appPassword");
    if (stored) {
      axios.post("https://plant-watering.onrender.com/api/auth", { password: stored })
        .then(res => {
          if (res.data.success) {
            setPassword(stored);
            setIsAuthorized(true);
            axios.defaults.headers.common["x-app-password"] = stored;
          } else {
            localStorage.removeItem("appPassword");
          }
        })
        .catch(() => {
          localStorage.removeItem("appPassword");
        });
    }
  }, []);

  const handleLogin = async () => {
    if (!password) return;

    try {
      const res = await axios.post("https://plant-watering.onrender.com/api/auth", { password });

      if (res.data.success) {
        // password correct
        setIsAuthorized(true);
        axios.defaults.headers.common["x-app-password"] = password;

        if (rememberMe) {
          localStorage.setItem("appPassword", password);
        }
      }
    } catch (err) {
      alert("Väärä salasana!");
      setIsAuthorized(false);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-emerald-200">
          <h2 className="mb-6 text-2xl font-bold text-center text-emerald-700">
            Kasvien kastelu - Kirjaudu sisään
          </h2>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Syötä salis"
            className="w-full p-3 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
          />

          <label className="flex items-center mb-4 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2 accent-emerald-600"
            />
            Muista meikämandoliini
          </label>

          <button
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Kirjaudu
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-neutral-900 to-black text-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-8xl font-extrabold tracking-tight">Kasvien kastelu</h1>
        </header>

        <nav className="mb-4">
          <ul className="flex items-center gap-3 text-base">
            <li><Link to="/" className="text-gray-300 hover:text-white">Yleisnäkymä</Link></li>
            <li><Link to="/plants" className="text-gray-300 hover:text-white">Kasvit</Link></li>
            <li><Link to="/positions" className="text-gray-300 hover:text-white">Sijainnit</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <main>
                    <PlantList password={password} />
                  </main>
                </div>
              </>
            }
          />
          <Route path="/add" element={<AddPlant password={password} />} />
          <Route path="/plants/:id" element={<PlantInfo password={password} />} />
          <Route path="/plants" element={<PlantsPage password={password} />} />
          <Route path="/positions" element={<PositionsPage password={password} />} />
        </Routes>
      </div>
      <div className="flex items-center space-x-3">
        <Link to="/add" className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md font-semibold">Lisää kasvi</Link>
        {isAuthorized && (
          <button onClick={handleLogout} className="px-3 py-2 border rounded text-sm">Kirjaudu ulos</button>
        )}
      </div>
    </div>
  );
}

export default App;
