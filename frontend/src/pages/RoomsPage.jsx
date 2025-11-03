import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function RoomsPage({ password }) {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [blueprintUrl, setBlueprintUrl] = useState('');

  const fetchRooms = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/rooms', { headers: { 'x-app-password': password } });
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(()=>{ fetchRooms(); }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/api/rooms', { name, blueprintUrl }, { headers: { 'x-app-password': password } });
      setName(''); setBlueprintUrl('');
      fetchRooms();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Rooms</h2>
        <Link to="/" className="px-3 py-1 bg-gray-700 rounded">Back</Link>
      </div>

      <form onSubmit={createRoom} className="mb-4 flex space-x-2">
        <input placeholder="Room name" value={name} onChange={(e)=>setName(e.target.value)} className="bg-gray-800 p-2 rounded" required />
        <input placeholder="Blueprint image URL (optional)" value={blueprintUrl} onChange={(e)=>setBlueprintUrl(e.target.value)} className="bg-gray-800 p-2 rounded" />
        <button className="bg-green-500 px-3 py-1 rounded">Create</button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rooms.map(r => (
          <div key={r._id} className="bg-gray-800 p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-sm text-gray-400">{r.blueprintUrl ? 'Has blueprint' : 'No blueprint'}</div>
              </div>
              <Link to={`/rooms/${r._id}`} className="px-3 py-1 bg-gray-700 rounded">Open</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
