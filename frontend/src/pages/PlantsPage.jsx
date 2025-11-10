import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PlantsPage({ password }) {
  const [plants, setPlants] = useState([]);
  const [sort, setSort] = useState('name');
  const location = useLocation();

  const fetchPlants = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/plants`, { headers: { 'x-app-password': password } });
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPlants(); }, []);

  const sorted = plants.slice().sort((a,b)=>{
    if (sort === 'lastWatered') {
      const getLast = (p) => {
        if (p.lastWatered) return new Date(p.lastWatered);
        if (p.wateringHistory && p.wateringHistory.length) return new Date(p.wateringHistory[p.wateringHistory.length-1]?.date || 0);
        return new Date(0);
      };
      const ad = getLast(a);
      const bd = getLast(b);
      return bd - ad; // newest first
    }
    if (sort === 'plantType') {
      return (a.plantType || '').localeCompare(b.plantType || '');
    }
    if (sort === 'room') {
      return (a.room || '').localeCompare(b.room || '');
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">Kasvit</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm">Järjestä:</label>
          <select value={sort} onChange={(e)=>setSort(e.target.value)} className="bg-gray-800 text-gray-100 p-1 rounded">
            <option value="name">Nimi</option>
            <option value="lastWatered">Viimeksi kasteltu</option>
            <option value="plantType">Kasvityyppi</option>
            <option value="room">Huone</option>
          </select>
        </div>
      </div>
      {/* Positions link removed from Plants page per user request */}

      <div className="space-y-2">
        {sorted.map(p => (
          <div key={p._id} className="bg-gray-800 p-3 rounded flex items-center justify-between">
            <div>
              <div className="font-bold">{p.name}</div>
              <div className="text-sm text-gray-400">{p.plantType || '—'} · Huone: {p.room || '—'}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to={`/plants/${p._id}`} state={{ from: location }} className="px-3 py-1 bg-gray-700 rounded text-gray-100">Lisätietoja</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
