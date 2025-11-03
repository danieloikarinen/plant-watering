import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import Blueprint from '../components/Blueprint';

export default function PlantsPage({ password }) {
  const [plants, setPlants] = useState([]);
  const [sort, setSort] = useState('name');
  const location = useLocation();

  const fetchPlants = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/plants', { headers: { 'x-app-password': password } });
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPlants(); }, []);

  const sorted = plants.slice().sort((a,b)=>{
    if (sort === 'lastWatered') {
      const ad = new Date(a.lastWatered || (a.wateringHistory && a.wateringHistory[a.wateringHistory.length-1]?.date));
      const bd = new Date(b.lastWatered || (b.wateringHistory && b.wateringHistory[b.wateringHistory.length-1]?.date));
      return bd - ad; // newest first
    }
    if (sort === 'plantType') {
      return (a.plantType || '').localeCompare(b.plantType || '');
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">All Plants</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm">Sort by:</label>
          <select value={sort} onChange={(e)=>setSort(e.target.value)} className="bg-gray-800 text-gray-100 p-1 rounded">
            <option value="name">Name</option>
            <option value="lastWatered">Last watered</option>
            <option value="plantType">Plant type</option>
            <option value="room">Room</option>
          </select>
        </div>
      </div>

      {/* Blueprint view: place your apartment image as frontend/public/blueprint.jpg */}
      <div className="mb-6">
        <Blueprint imageUrl={'/blueprint.jpg'} plants={plants} password={password} onPositionUpdated={(updated)=>{
          setPlants(prev => prev.map(p => p._id === updated._id ? updated : p));
        }} />
      </div>

      <div className="space-y-2">
        {sorted.map(p => (
          <div key={p._id} className="bg-gray-800 p-3 rounded flex items-center justify-between">
            <div>
              <div className="font-bold">{p.name}</div>
              <div className="text-sm text-gray-400">{p.plantType || '—'} · Room: {p.room || '—'}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to={`/plants/${p._id}`} state={{ from: location }} className="px-3 py-1 bg-gray-700 rounded text-gray-100">More</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
