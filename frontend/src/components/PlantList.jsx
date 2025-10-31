import { useEffect, useState } from "react";
import axios from "axios";

export default function PlantList({ password }) {
  const [plants, setPlants] = useState([]);

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
    await axios.post(`http://localhost:4000/api/plants/${id}/water`, null, {
      headers: { "x-app-password": password },
    });
    fetchPlants();
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
    <div className="mt-6">
      {plants.map((plant) => (
        <div
          key={plant._id}
          className="border p-4 mb-2 flex justify-between items-center"
        >
          <div>
            <h2 className="font-bold">{plant.name}</h2>
            <p>Room: {plant.room}</p>
            <p>Next watering in: {plant.wateringFrequency} days</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => waterPlant(plant._id)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Water Now
            </button>
            <button
              onClick={() => deletePlant(plant._id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
