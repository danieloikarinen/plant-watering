import { useState } from "react";
import axios from "axios";

export default function PlantForm({ password }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:4000/api/plants",
        { name, room, wateringFrequency },
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
    <form onSubmit={handleSubmit} className="border p-4 mb-4 rounded">
      <h2 className="font-bold mb-2">Add New Plant</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        type="text"
        placeholder="Room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        type="number"
        placeholder="Watering Frequency (days)"
        value={wateringFrequency}
        onChange={(e) => setWateringFrequency(e.target.value)}
        className="border p-2 w-full mb-2"
        min={1}
        required
      />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
        Add Plant
      </button>
    </form>
  );
}
