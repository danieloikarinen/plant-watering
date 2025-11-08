import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);

export default function PlantList({ password }) {
  const [plants, setPlants] = useState([]);
  const [fertilizerChecked, setFertilizerChecked] = useState({});
  

  const fetchPlants = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/plants", {
        headers: { "x-app-password": password },
      });
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const waterPlant = async (id) => {
    const fertilizer = !!fertilizerChecked[id];
    await axios.post(
      `http://localhost:4000/api/plants/${id}/water`,
      { fertilizer },
      { headers: { "x-app-password": password } }
    );
    fetchPlants();
    // reset checkbox for this plant
    setFertilizerChecked((prev) => ({ ...prev, [id]: false }));
  };



  useEffect(() => {
    fetchPlants();
  }, []);

  // split plants into needsWater (nextWaterDate <= today or never watered) and others
  const now = dayjs();
  const needsWater = [];
  const notYet = [];

  // helper: return Dayjs of the most recent watering (lastWatered field or last entry in wateringHistory)
  const getLastWateredDate = (plant) => {
    // Compute newest date across lastWatered and wateringHistory entries
    let newest = null;
    if (plant.lastWatered) {
      const lw = dayjs(plant.lastWatered);
      if (lw && lw.isValid()) newest = lw;
    }
    if (plant.wateringHistory && plant.wateringHistory.length) {
      for (let i = 0; i < plant.wateringHistory.length; i++) {
        const ev = plant.wateringHistory[i];
        const d = dayjs(ev && typeof ev === 'object' ? (ev.date ?? ev) : ev);
        if (!d || !d.isValid()) continue;
        if (!newest || d.isAfter(newest)) newest = d;
      }
    }
    return newest;
  };

  // helper: return Dayjs of the most recent fertilization (lastFertilized or last wateringHistory entry with fertilizer)
  const getLastFertilizedDate = (plant) => {
    // Prefer the most recent fertilizer event from wateringHistory, but also consider lastFertilized
    let newest = null;
    if (plant.wateringHistory && plant.wateringHistory.length) {
      for (let i = 0; i < plant.wateringHistory.length; i++) {
        const ev = plant.wateringHistory[i];
        const hasF = ev && (typeof ev === 'object' ? !!ev.fertilizer : false);
        if (!hasF) continue;
        const d = dayjs(ev && typeof ev === 'object' ? (ev.date ?? ev) : ev);
        if (!d || !d.isValid()) continue;
        if (!newest || d.isAfter(newest)) newest = d;
      }
    }
    if (plant.lastFertilized) {
      const lf = dayjs(plant.lastFertilized);
      if (lf && lf.isValid() && (!newest || lf.isAfter(newest))) newest = lf;
    }
    return newest;
  };

  plants.forEach(plant => {
    const last = getLastWateredDate(plant);
    if (!last || !last.isValid()) {
      // never watered or invalid date -> needs water
      needsWater.push(plant);
      return;
    }
    const freq = plant.wateringFrequency || 0;
    const next = last.add(freq, 'day');
    if (next.isSameOrBefore(now, 'day')) needsWater.push(plant);
    else notYet.push(plant);
  });

  // sort needsWater by how overdue they are (oldest next date first)
  needsWater.sort((a,b)=>{
    const an = getLastWateredDate(a) || dayjs(0);
    const bn = getLastWateredDate(b) || dayjs(0);
    return an.add(a.wateringFrequency||0,'day').diff(bn.add(b.wateringFrequency||0,'day'));
  });
  notYet.sort((a,b)=>{
    const an = getLastWateredDate(a) || dayjs(0);
    const bn = getLastWateredDate(b) || dayjs(0);
    return an.add(a.wateringFrequency||0,'day').diff(bn.add(b.wateringFrequency||0,'day'));
  });

  // Listen for refresh events (dispatched after adding a plant) so we can re-fetch without
  // forcing a full page reload that would reset login state.
  useEffect(() => {
    const handler = () => fetchPlants();
    window.addEventListener("plantsUpdated", handler);
    return () => window.removeEventListener("plantsUpdated", handler);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-3">Water now</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {needsWater.length === 0 ? (
              <div className="col-span-full text-center text-green-400 py-6">
                All good — no plants need watering
              </div>
            ) : (
              needsWater.map(plant => (
              <div key={plant._id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{plant.name}</h2>
                    <p className="text-sm text-gray-300">Room: {plant.room}</p>
                    {(() => {
                      const last = (function(){
                        if (plant.lastWatered) return dayjs(plant.lastWatered);
                        if (plant.wateringHistory && plant.wateringHistory.length) return dayjs(plant.wateringHistory[plant.wateringHistory.length-1]?.date ?? plant.wateringHistory[plant.wateringHistory.length-1]);
                        return null;
                      })();
                      return (
                        <p className="text-sm text-gray-400">Last watered: {last && last.isValid() ? last.fromNow() : 'Never'}</p>
                      );
                    })()}
                    {(() => {
                      const lf = getLastFertilizedDate(plant);
                      return lf && lf.isValid() ? <p className="text-xs text-gray-400">Last fertilized: {lf.fromNow()}</p> : null;
                    })()}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => waterPlant(plant._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                    >
                      Water Now
                    </button>

                    <label className="flex items-center space-x-2 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={!!fertilizerChecked[plant._id]}
                        onChange={() =>
                          setFertilizerChecked((prev) => ({
                            ...prev,
                            [plant._id]: !prev[plant._id],
                          }))
                        }
                        aria-label="Fertilize"
                        title="Water with fertilizer"
                        className="h-4 w-4"
                      />
                      <span>Fertilize</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link to={`/plants/${plant._id}`} className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1 rounded-md">More info</Link>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">No need to water yet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notYet.map(plant => (
              <div key={plant._id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{plant.name}</h2>
                    <p className="text-sm text-gray-300">Room: {plant.room}</p>
                    {(() => {
                      const last = (function(){
                        if (plant.lastWatered) return dayjs(plant.lastWatered);
                        if (plant.wateringHistory && plant.wateringHistory.length) return dayjs(plant.wateringHistory[plant.wateringHistory.length-1]?.date ?? plant.wateringHistory[plant.wateringHistory.length-1]);
                        return null;
                      })();
                      return (
                        <p className="text-sm text-gray-400">Last watered: {last && last.isValid() ? last.fromNow() : 'Never'}</p>
                      );
                    })()}
                    {(() => {
                      const lf = getLastFertilizedDate(plant);
                      return lf && lf.isValid() ? <p className="text-xs text-gray-400">Last fertilized: {lf.fromNow()}</p> : null;
                    })()}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => waterPlant(plant._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                    >
                      Water Now
                    </button>

                    <label className="flex items-center space-x-2 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={!!fertilizerChecked[plant._id]}
                        onChange={() =>
                          setFertilizerChecked((prev) => ({
                            ...prev,
                            [plant._id]: !prev[plant._id],
                          }))
                        }
                        aria-label="Fertilize"
                        title="Water with fertilizer"
                        className="h-4 w-4"
                      />
                      <span>Fertilize</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link to={`/plants/${plant._id}`} className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1 rounded-md">More info</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* No modal: navigation to dedicated page handles info */}
    </>
  );
}
