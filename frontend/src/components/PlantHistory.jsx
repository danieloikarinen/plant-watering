import { useState } from "react";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PlantHistory({ plant: initialPlant, password, onClose }) {
  const [plant, setPlant] = useState(initialPlant);
  const [date, setDate] = useState("");
  const [fertilizer, setFertilizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sortedHistory = (plant.wateringHistory || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // convert datetime-local string to ISO (backend will parse)
      const payload = { fertilizer };
      if (date) payload.date = date; // datetime-local is acceptable

      const res = await axios.post(
        `${API_BASE_URL}/api/plants/${plant._id}/water`,
        payload,
        { headers: { "x-app-password": password } }
      );

      // update local plant view with returned document
      setPlant(res.data);
      // notify app lists to refresh
      try {
        window.dispatchEvent(new Event("plantsUpdated"));
      } catch (err) {}

      // reset form
      setDate("");
      setFertilizer(false);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-11/12 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">History for {plant.name}</h2>
          <button onClick={onClose} className="px-2 py-1 border rounded">Close</button>
        </div>

        <div className="mb-4 max-h-64 overflow-auto">
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-gray-600">No history yet.</p>
          ) : (
            <ul className="space-y-2">
              {sortedHistory.map((ev, idx) => (
                <li key={idx} className="border p-2 rounded flex justify-between">
                  <div>
                    <div className="font-medium">{new Date(ev.date).toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{ev.fertilizer ? "With fertilizer" : "Water only"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleAdd} className="border-t pt-4">
          <h3 className="font-semibold mb-2">Add missing history</h3>
          <div className="mb-2">
            <label className="block text-sm mb-1">Date/time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 w-full"
            />
            <div className="text-xs text-gray-500">Leave empty to use current time</div>
          </div>

          <label className="flex items-center space-x-2 mb-4">
            <input type="checkbox" checked={fertilizer} onChange={(e) => setFertilizer(e.target.checked)} />
            <span>Fertilizer applied</span>
          </label>

          {error && <div className="text-red-600 mb-2">{error}</div>}

          <div className="flex space-x-2">
            <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">
              {loading ? "Saving..." : "Add history"}
            </button>
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded">
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
