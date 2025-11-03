import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function PlantList({ password }) {
  const [plants, setPlants] = useState([]);
  const [fertilizerChecked, setFertilizerChecked] = useState({});
  

  const fetchPlants = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/plants", {
        headers: { "x-app-password": password },
      });
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const waterPlant = async (id) => {
    const fertilizer = !!fertilizerChecked[id];
    await axios.post(
      `http://localhost:4000/api/plants/${id}/water`,
      { fertilizer },
      { headers: { "x-app-password": password } }
    );
    fetchPlants();
    // reset checkbox for this plant
    setFertilizerChecked((prev) => ({ ...prev, [id]: false }));
  };

  const deletePlant = async (id) => {
    await axios.delete(`http://localhost:4000/api/plants/${id}`, {
      headers: { "x-app-password": password },
    });
    fetchPlants();
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  // Listen for refresh events (dispatched after adding a plant) so we can re-fetch without
  // forcing a full page reload that would reset login state.
  useEffect(() => {
    const handler = () => fetchPlants();
    window.addEventListener("plantsUpdated", handler);
    return () => window.removeEventListener("plantsUpdated", handler);
  }, []);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plants.map((plant) => (
          <div key={plant._id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg">{plant.name}</h2>
                <p className="text-sm text-gray-300">Room: {plant.room}</p>
                <p className="text-sm text-gray-400">Next watering in: {plant.wateringFrequency} days</p>
                {plant.lastFertilized && (
                  <p className="text-xs text-gray-400">Last fertilized: {new Date(plant.lastFertilized).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => waterPlant(plant._id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                >
                  Water Now
                </button>

                <label className="flex items-center space-x-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={!!fertilizerChecked[plant._id]}
                    onChange={() =>
                      setFertilizerChecked((prev) => ({
                        ...prev,
                        [plant._id]: !prev[plant._id],
                      }))
                    }
                    aria-label="Fertilize"
                    title="Water with fertilizer"
                    className="h-4 w-4"
                  />
                  <span>Fertilize</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Link to={`/plants/${plant._id}`} className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1 rounded-md">
                  More info
                </Link>
                <button
                  onClick={() => deletePlant(plant._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* No modal: navigation to dedicated page handles info */}
    </>
  );
}
