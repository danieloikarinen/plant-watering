import { useEffect, useState } from 'react';
import axios from 'axios';
import Blueprint from '../components/Blueprint';
import pohja from '../assets/pohja_edited.png';

export default function PositionsPage({ password }) {
  const [plants, setPlants] = useState([]);

  const fetchPlants = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/plants', { headers: { 'x-app-password': password } });
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPlants(); }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Plant positions</h2>
      <p className="text-sm text-gray-400 mb-4">Drag pins on the blueprint to reposition plants.</p>

      <Blueprint
        imageUrl={pohja}
        plants={plants}
        password={password}
        onPositionUpdated={async (updated) => {
          setPlants(prev => prev.map(p => p._id === updated._id ? updated : p));
          // ensure we reflect server state
          try { await fetchPlants(); } catch (e) { console.error('refetch failed', e); }
        }}
      />
    </div>
  );
}
