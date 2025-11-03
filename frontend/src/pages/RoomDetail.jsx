import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function RoomDetail({ password }) {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [plants, setPlants] = useState([]);
  const containerRef = useRef();

  const fetchRoom = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/rooms/${id}`, { headers: { 'x-app-password': password } });
      setRoom(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchPlants = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/plants', { headers: { 'x-app-password': password } });
      // filter by room name
      setPlants(res.data.filter(p => p.room === room?.name));
    } catch (err) { console.error(err); }
  };

  useEffect(()=>{ fetchRoom(); }, [id]);
  useEffect(()=>{ if (room) fetchPlants(); }, [room]);

  // Drag handling
  const onDragStart = (e, plant) => {
    e.dataTransfer?.setData('text/plain', plant._id);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    const plantId = e.dataTransfer.getData('text/plain');
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    try {
      await axios.put(`http://localhost:4000/api/plants/${plantId}`, { position: { x, y }, room: room.name }, { headers: { 'x-app-password': password } });
      fetchPlants();
      try{ window.dispatchEvent(new Event('plantsUpdated')) }catch(e){}
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Room — {room?.name}</h2>
        <Link to="/rooms" className="px-3 py-1 bg-gray-700 rounded">Back</Link>
      </div>

      <div className="border rounded p-4">
        {room?.blueprintUrl ? (
          <div ref={containerRef} onDragOver={(e)=>e.preventDefault()} onDrop={onDrop} className="relative w-full h-96 bg-gray-900">
            <img src={room.blueprintUrl} alt="blueprint" className="w-full h-full object-contain" />
            {plants.map(p => (
              <div key={p._id} draggable onDragStart={(e)=>onDragStart(e,p)} style={{ position: 'absolute', left: `${p.position?.x || 5}%`, top: `${p.position?.y || 5}%`, transform: 'translate(-50%,-50%)' }}>
                <div className="h-4 w-4 rounded-full bg-green-400 border-2 border-white" title={p.name}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-gray-400">No blueprint set for this room. Add a blueprint URL from the Rooms page.</div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Plants in this room</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {plants.map(p => (
            <div key={p._id} className="bg-gray-800 p-2 rounded flex items-center justify-between">
              <div>
                <div className="font-bold">{p.name}</div>
                <div className="text-sm text-gray-400">{p.plantType}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Link to={`/plants/${p._id}`} className="px-2 py-1 bg-gray-700 rounded">More</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
