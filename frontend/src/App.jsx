import { useState } from "react";
import PlantList from "./components/PlantList";
import PlantForm from "./components/PlantForm";

function App() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogin = () => {
    if (password) setIsAuthorized(true);
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🌿 Plant Watering Tracker</h1>
      <PlantForm password={password} />
      <PlantList password={password} />
    </div>
  );
}

export default App;
