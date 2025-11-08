import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  // Prefer navigating back in history; fall back to the originating location state or '/'
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) return navigate(-1);
        const fromPath = (location.state && location.state.from && (location.state.from.pathname + (location.state.from.search || '')) ) || '/';
        navigate(fromPath);
      }}
      className="px-3 py-1 border rounded"
    >Takaisin</button>
  );
}

export default function PlantInfo({ password }) {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [editableRoom, setEditableRoom] = useState("");
  const [editableFreq, setEditableFreq] = useState(1);
  const [editablePlantType, setEditablePlantType] = useState("");

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
      setEditablePlantType(plant.plantType || "");
    }
  }, [plant]);

  const navigate = useNavigate();

  const deletePlant = async () => {
    if (!confirm('Delete this plant? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:4000/api/plants/${id}`, { headers: { 'x-app-password': password } });
      try { window.dispatchEvent(new Event('plantsUpdated')) } catch(e) {}
      // go back to previous page
      if (window.history.length > 1) navigate(-1); else navigate('/');
    } catch (err) {
      console.error('Failed to delete plant', err?.response?.data || err.message || err);
    }
  };

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
      // Send only the updated fields; backend merges them onto the document.
      console.log('Updating plant', id, 'with', updates);
      const res = await axios.put(`http://localhost:4000/api/plants/${id}`, updates, {
        headers: { "x-app-password": password },
      });
      console.log('Update response:', res.status, res.data);
      setPlant(res.data);
      try { window.dispatchEvent(new Event('plantsUpdated')) } catch(e) {}
      return res.data;
    } catch (err) {
      console.error('updatePlant error:', err?.response?.data || err.message || err);
    }
  };

  if (loading) return <div className="p-4">Ladataan...</div>;
  if (!plant) return <div className="p-4">Kasvia ei löytynyt</div>;

  const sortedHistory = (plant.wateringHistory || []).slice().sort((a,b)=> new Date(b.date) - new Date(a.date));

  return (
    <div className="container mx-auto p-4 text-gray-100">
      <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{plant.name}</h1>
            <div className="flex items-center space-x-2">
                {/* Return to previous page (passed via Link state) or fallback to /plants */}
                <BackButton />
              </div>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Kasteluhistoria</h2>
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-gray-600">Ei kasteluhistoriaa vielä.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-auto">
              {sortedHistory.map((ev, idx) => (
                <li key={idx} className="border p-2 rounded">
                  <div className="font-medium">{new Date(ev.date).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{ev.fertilizer ? 'Ravinne' : 'Ei ravinnetta'}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Lisää kastelukerta</h3>
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
                <label className="block text-sm mb-1">Päivämäärä ja aika</label>
                <input type="datetime-local" name="date" className="border p-2 w-full" />
                <div className="text-xs text-gray-500">Jätä tyhjäksi käyttääksesi nykyistä aikaa</div>
              </div>
              <label className="flex items-center space-x-2 mb-2">
                <input type="checkbox" name="fertilizer" />
                <span>Ravinne lisätty</span>
              </label>
              <div>
                <button className="bg-green-500 text-white px-4 py-2 rounded" type="submit">Lisää kastelu</button>
              </div>
            </form>
          </div>
        </div>

        <div className="border p-4 rounded">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Muokkaa kasvin tietoja</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Huone</label>
                <input value={editableRoom} onChange={(e)=>setEditableRoom(e.target.value)} className="bg-gray-900 border border-gray-700 p-2 w-full text-gray-100 rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Kasvityyppi</label>
                <input value={editablePlantType} onChange={(e)=>setEditablePlantType(e.target.value)} className="bg-gray-900 border border-gray-700 p-2 w-full text-gray-100 rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Kasteluväli (päivinä)</label>
                <input type="number" value={editableFreq} onChange={(e)=>setEditableFreq(e.target.value)} min={1} className="bg-gray-900 border border-gray-700 p-2 w-full text-gray-100 rounded" />
              </div>
              <div className="flex space-x-2 mt-2">
                <button onClick={async ()=>{
                  await updatePlant({ room: editableRoom, wateringFrequency: Number(editableFreq), plantType: editablePlantType });
                }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">Tallenna</button>
                <button onClick={()=>{ setEditableRoom(plant.room||""); setEditableFreq(plant.wateringFrequency||1); setEditablePlantType(plant.plantType||""); }} className="px-3 py-2 border rounded">Nollaa muutokset</button>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2">Muistiinpanot</h2>
          <form onSubmit={addNote} className="mb-4">
            <textarea value={noteText} onChange={(e)=>setNoteText(e.target.value)} className="bg-gray-900 border border-gray-700 p-2 w-full mb-2 text-gray-100" rows={4} />
            <div className="flex space-x-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" disabled={noteLoading}>{noteLoading ? 'Tallennetaan...' : 'Lisää muistiinpano'}</button>
              <button type="button" onClick={()=>setNoteText('')} className="px-3 py-2 border rounded">Tyhjennä</button>
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
        <div className="mt-4 flex justify-end">
        <button onClick={deletePlant} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Poista kasvi :(</button>
        </div>
    </div>
  );
}
