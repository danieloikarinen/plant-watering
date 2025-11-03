import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = (location.state && location.state.from && (location.state.from.pathname + (location.state.from.search || ''))) || '/plants';
  return <button onClick={() => navigate(fromPath)} className="px-3 py-1 border rounded">Back</button>;
}

export default function PlantInfo({ password }) {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [editableRoom, setEditableRoom] = useState("");
  const [editableFreq, setEditableFreq] = useState(1);

  const fetchPlant = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:4000/api/plants/${id}`, {
        headers: { "x-app-password": password },
      });
      setPlant(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlant();
  }, [id]);

  // When plant loads, populate editable fields
  useEffect(() => {
    if (plant) {
      setEditableRoom(plant.room || "");
      setEditableFreq(plant.wateringFrequency || 1);
    }
  }, [plant]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:4000/api/plants/${id}/notes`,
        { text: noteText },
        { headers: { "x-app-password": password } }
      );
      setPlant(res.data);
      setNoteText("");
      try { window.dispatchEvent(new Event('plantsUpdated')) } catch(e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setNoteLoading(false);
    }
  };

  const updatePlant = async (updates) => {
    try {
      const res = await axios.put(`http://localhost:4000/api/plants/${id}`, updates, {
        headers: { "x-app-password": password },
      });
      setPlant(res.data);
      try { window.dispatchEvent(new Event('plantsUpdated')) } catch(e) {}
      return res.data;
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!plant) return <div className="p-4">Plant not found</div>;

  const sortedHistory = (plant.wateringHistory || []).slice().sort((a,b)=> new Date(b.date) - new Date(a.date));

  return (
    <div className="container mx-auto p-4 text-gray-100">
      <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">More info — {plant.name}</h1>
            {/* Return to previous page (passed via Link state) or fallback to /plants */}
            <BackButton />
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Watering history</h2>
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-gray-600">No watering history yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-auto">
              {sortedHistory.map((ev, idx) => (
                <li key={idx} className="border p-2 rounded">
                  <div className="font-medium">{new Date(ev.date).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{ev.fertilizer ? 'With fertilizer' : 'Water only'}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Add missing history</h3>
            {/* Reuse same simple form as modal used previously */}
            <form onSubmit={async (e)=>{
              e.preventDefault();
              const form = e.target;
              const date = form.date?.value || null;
              const fertilizer = form.fertilizer?.checked || false;
              try{
                const res = await axios.post(`http://localhost:4000/api/plants/${id}/water`, { date, fertilizer }, { headers: { 'x-app-password': password } });
                setPlant(res.data);
                try{ window.dispatchEvent(new Event('plantsUpdated')) }catch(e){}
                form.reset();
              }catch(err){console.error(err)}
            }}>
              <div className="mb-2">
                <label className="block text-sm mb-1">Date/time</label>
                <input type="datetime-local" name="date" className="border p-2 w-full" />
                <div className="text-xs text-gray-500">Leave empty to use current time</div>
              </div>
              <label className="flex items-center space-x-2 mb-2">
                <input type="checkbox" name="fertilizer" />
                <span>Fertilizer applied</span>
              </label>
              <div>
                <button className="bg-green-500 text-white px-4 py-2 rounded" type="submit">Add history</button>
              </div>
            </form>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Notes</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Edit basic info</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Room</label>
                <input value={editableRoom} onChange={(e)=>setEditableRoom(e.target.value)} className="bg-gray-900 border border-gray-700 p-2 w-full text-gray-100 rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Watering frequency (days)</label>
                <input type="number" value={editableFreq} onChange={(e)=>setEditableFreq(e.target.value)} min={1} className="bg-gray-900 border border-gray-700 p-2 w-full text-gray-100 rounded" />
              </div>
              <div className="flex space-x-2 mt-2">
                <button onClick={async ()=>{
                  await updatePlant({ room: editableRoom, wateringFrequency: Number(editableFreq) });
                }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">Save</button>
                <button onClick={()=>{ setEditableRoom(plant.room||""); setEditableFreq(plant.wateringFrequency||1); }} className="px-3 py-2 border rounded">Reset</button>
              </div>
            </div>
          </div>
          <form onSubmit={addNote} className="mb-4">
            <textarea value={noteText} onChange={(e)=>setNoteText(e.target.value)} className="bg-gray-900 border border-gray-700 p-2 w-full mb-2 text-gray-100" rows={4} />
            <div className="flex space-x-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" disabled={noteLoading}>{noteLoading ? 'Saving...' : 'Add note'}</button>
              <button type="button" onClick={()=>setNoteText('')} className="px-3 py-2 border rounded">Clear</button>
            </div>
          </form>

          <div className="space-y-2 max-h-64 overflow-auto">
            {(plant.notes || []).slice().reverse().map((n, idx)=> (
              <div key={idx} className="border p-2 rounded">
                <div className="text-sm text-gray-600">{new Date(n.date).toLocaleString()}</div>
                <div className="mt-1">{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
