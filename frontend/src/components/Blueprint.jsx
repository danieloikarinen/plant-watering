import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

// Blueprint component shows a single apartment image and draggable plant pins.
// Props:
// - imageUrl: string (path to blueprint image, e.g. '/blueprint.jpg')
// - plants: array of plant objects with _id, name and position {x,y} in percent (0-100)
// - password: optional app password header value
// - onPositionUpdated(updatedPlant): callback when server confirms updated position
export default function Blueprint({ imageUrl, plants = [], password, onPositionUpdated }) {
  const imgRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  function clientToPercent(clientX, clientY) {
    const img = imgRef.current;
    if (!img) return { x: 50, y: 50 };
    const rect = img.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }

  function onMouseDown(e, id) {
    e.preventDefault();
    setDraggingId(id);
  }

  function onMouseMove(e) {
    if (!draggingId) return;
    const pos = clientToPercent(e.clientX, e.clientY);
    const el = document.querySelector(`[data-plant-pin="${draggingId}"]`);
    if (el) {
      el.style.left = `${pos.x}%`;
      el.style.top = `${pos.y}%`;
    }
  }

  async function onMouseUp(e) {
    if (!draggingId) return;
    const pos = clientToPercent(e.clientX, e.clientY);
    const plant = plants.find(p => p._id === draggingId);
    setDraggingId(null);
    if (!plant) return;

    try {
      // Prefer updating only the position to avoid overwriting other fields
      const res = await axios.put(
        `http://localhost:4000/api/plants/${plant._id}`,
        { position: { x: pos.x, y: pos.y } },
        { headers: { 'x-app-password': password } }
      );
      if (onPositionUpdated) onPositionUpdated(res.data);
    } catch (err) {
      console.error('Failed to save plant position', err);
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggingId, plants]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1000 }}>
      <img ref={imgRef} src={imageUrl} alt="Blueprint" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
      {plants.map(p => {
        const x = (p.position && typeof p.position.x === 'number') ? p.position.x : 50;
        const y = (p.position && typeof p.position.y === 'number') ? p.position.y : 50;
        return (
          <div
            key={p._id}
            data-plant-pin={p._id}
            onMouseDown={(e) => onMouseDown(e, p._id)}
            title={p.name}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -100%)',
              cursor: 'grab',
              zIndex: 20,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 14, background: '#16a34a', color:'#fff',
              display: 'flex', alignItems:'center', justifyContent:'center', fontSize:14, boxShadow:'0 2px 6px rgba(0,0,0,0.3)'
            }}>
              🌿
            </div>
          </div>
        );
      })}
    </div>
  );
}
