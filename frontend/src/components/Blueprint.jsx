import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Enhanced Blueprint: touch + mouse support, edit toggle, optimistic saves
export default function Blueprint({ imageUrl = '/assets/pohja_chatgpt.png', plants = [], password, onPositionUpdated }) {
  const imgRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  function clientToPercent(clientX, clientY) {
    const img = imgRef.current;
    if (!img) return { x: 50, y: 50 };
    const rect = img.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }

  function startDrag(clientX, clientY, id) {
    setDraggingId(id);
    const pos = clientToPercent(clientX, clientY);
    const el = document.querySelector(`[data-plant-pin="${id}"]`);
    if (el) {
      el.style.left = `${pos.x}%`;
      el.style.top = `${pos.y}%`;
    }
  }

  function onMouseDown(e, id) {
    if (!editing) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY, id);
  }

  function onTouchStart(e, id) {
    if (!editing) return;
    e.preventDefault();
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY, id);
  }

  function onPointerMove(clientX, clientY) {
    if (!draggingId) return;
    const pos = clientToPercent(clientX, clientY);
    const el = document.querySelector(`[data-plant-pin="${draggingId}"]`);
    if (el) {
      el.style.left = `${pos.x}%`;
      el.style.top = `${pos.y}%`;
    }
  }

  function onMouseMove(e) { onPointerMove(e.clientX, e.clientY); }
  function onTouchMove(e) { if (!draggingId) return; onPointerMove(e.touches[0].clientX, e.touches[0].clientY); }

  async function finishDrag(clientX, clientY) {
    if (!draggingId) return;
    const pos = clientToPercent(clientX, clientY);
    const plant = plants.find(p => p._id === draggingId);
    setDraggingId(null);
    if (!plant) return;

    // optimistic update: update parent immediately so UI moves
    const optimistic = { ...plant, position: { x: pos.x, y: pos.y } };
    if (onPositionUpdated) onPositionUpdated(optimistic);

    try {
      // Send full plant object merged with new position so Mongoose validators
      // that check required fields don't reject the update.
      const payload = { ...plant, position: { x: pos.x, y: pos.y } };
      const res = await axios.put(
        `http://localhost:4000/api/plants/${plant._id}`,
        payload,
        { headers: { 'x-app-password': password } }
      );
      if (onPositionUpdated) onPositionUpdated(res.data);
    } catch (err) {
      console.error('Failed to save plant position', err?.response?.data || err.message || err);
      // revert by notifying parent with original plant
      if (onPositionUpdated) onPositionUpdated(plant);
    }
  }

  function handlePinClick(id) {
    if (editing) return; // don't navigate while in edit mode
    navigate(`/plants/${id}`);
  }

  function handlePinKeyDown(e, id) {
    if (editing) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/plants/${id}`);
    }
  }

  function onMouseUp(e) { finishDrag(e.clientX, e.clientY); }
  function onTouchEnd(e) { const t = e.changedTouches && e.changedTouches[0]; if (t) finishDrag(t.clientX, t.clientY); }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [draggingId, plants, editing]);

  return (
    <div>
      <div className="mb-2 flex items-center space-x-2">
        <button onClick={() => setEditing(e => !e)} className={`px-3 py-1 rounded ${editing ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>
          {editing ? 'Tallenna' : 'Muokkaa sijainteja'}
        </button>
        <div className="text-sm text-gray-400">{editing ? 'Vedä kasveja muokataksesi niiden sijainteja' : 'Tarkastelutila - klikkaa kasvia avataksesi sen tiedot'}</div>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 1000 }}>
  {/* Image shown at full width inside the container */}
  <img ref={imgRef} src={imageUrl} alt="Blueprint" style={{ width: '100%', display: 'block', borderRadius: 8 }} draggable={false} />
        {plants.map(p => {
          const x = (p.position && typeof p.position.x === 'number') ? p.position.x : 50;
          const y = (p.position && typeof p.position.y === 'number') ? p.position.y : 50;
          return (
            <div
              key={p._id}
              data-plant-pin={p._id}
              onMouseDown={(e) => onMouseDown(e, p._id)}
              onTouchStart={(e) => onTouchStart(e, p._id)}
              onClick={() => handlePinClick(p._id)}
              onKeyDown={(e) => handlePinKeyDown(e, p._id)}
              role="link"
              tabIndex={0}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -100%)',
                cursor: editing ? 'grab' : 'pointer',
                zIndex: 20,
                touchAction: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 14, background: '#16a34a', color:'#fff',
                display: 'flex', alignItems:'center', justifyContent:'center', fontSize:14, boxShadow:'0 2px 6px rgba(0,0,0,0.3)'
              }}>
                🌿
              </div>
              {/* persistent label for easier dragging/identification */}
              <div style={{
                marginTop: 6,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: 12,
                padding: '2px 6px',
                borderRadius: 6,
                pointerEvents: 'auto',
                whiteSpace: 'nowrap',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {p.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
