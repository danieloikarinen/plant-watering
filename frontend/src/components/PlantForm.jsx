import { useState } from "react";
import axios from "axios";

export default function PlantForm({ password }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [plantType, setPlantType] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:4000/api/plants",
        { name, room, plantType, wateringFrequency },
        { headers: { "x-app-password": password } }
      );
      setName("");
      setRoom("");
      setWateringFrequency(1);
      // Notify the app that a new plant was added so lists can refresh without reloading
      try {
        window.dispatchEvent(new Event("plantsUpdated"));
      } catch (e) {
        // fallback to reload if dispatch fails for some reason
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 text-gray-100 p-4 rounded-md">
      <h2 className="font-bold mb-3 text-lg">Add New Plant</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-gray-800 border border-gray-700 p-2 w-full mb-2 rounded"
        required
      />
        <input
          type="text"
          placeholder="Plant type (e.g., fern, succulent)"
          value={plantType}
          onChange={(e) => setPlantType(e.target.value)}
          className="bg-gray-800 border border-gray-700 p-2 w-full mb-2 rounded"
        />
      <input
        type="text"
        placeholder="Room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="bg-gray-800 border border-gray-700 p-2 w-full mb-2 rounded"
        required
      />
      <input
        type="number"
        placeholder="Watering Frequency (days)"
        value={wateringFrequency}
        onChange={(e) => setWateringFrequency(e.target.value)}
        className="bg-gray-800 border border-gray-700 p-2 w-full mb-3 rounded"
        min={1}
        required
      />
      <div className="flex items-center justify-end">
        <button type="submit" className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded-md font-semibold">
          Add Plant
        </button>
      </div>
    </form>
  );
}
