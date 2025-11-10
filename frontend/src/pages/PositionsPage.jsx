import { useEffect, useState } from 'react';
import axios from 'axios';
import Blueprint from '../components/Blueprint';
import pohja from '../assets/pohja_edited.png';
const backendApi = process.env.REACT_APP_BACKEND_URL;

export default function PositionsPage({ password }) {
  const [plants, setPlants] = useState([]);

  const fetchPlants = async () => {
    try {
      const res = await axios.get(`${backendApi}`, { headers: { 'x-app-password': password } });
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPlants(); }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Kasvien sijainnit kämpässä</h2>
      {/* <p className="text-sm text-gray-400 mb-4">Vedä kasveja muokataksesi niiden sijainteja tai avaa niiden omat sivut klikkaamalla ollessa tarkastelutilassa.</p> */}

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
