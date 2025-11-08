import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlantForm from '../components/PlantForm';

export default function AddPlant({ password }) {
  const navigate = useNavigate();
  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <PlantForm password={password} onAdded={() => navigate('/')} />
      </div>
    </div>
  );
}
