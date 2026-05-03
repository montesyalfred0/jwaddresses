import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addressAPI } from '../services/api';

export default function TerritoryDetail() {
  const { neighborhoodId } = useParams();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    family: '',
    address: '',
    location_string: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, [neighborhoodId]);

  const fetchAddresses = async () => {
    try {
      const { data } = await addressAPI.getAddresses(neighborhoodId);
      setAddresses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location_string) {
      alert('GPS location is required. Please click "Get GPS" to capture your location.');
      return;
    }
    try {
      await addressAPI.createAddress({
        ...formData,
        neighborhood_id: parseInt(neighborhoodId),
        age: formData.age && formData.age.trim() ? (() => {
          const parsed = parseInt(formData.age, 10);
          return !isNaN(parsed) && parsed > 0 ? parsed : undefined;
        })() : undefined,
      });
      setFormData({ name: '', age: '', family: '', address: '', location_string: '' });
      setShowForm(false);
      fetchAddresses();
    } catch (error) {
      console.error('Error creating address:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setFormData({ ...formData, location_string: locationString });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get location. Please enter manually.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div>
      <Link to="/territories" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to Territories
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : 'Add Address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Family</label>
              <input
                type="text"
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., mama martha delgado"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-gray-700 mb-2">Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.location_string}
                onChange={(e) => setFormData({ ...formData, location_string: e.target.value })}
                className="flex-1 p-2 border rounded"
                placeholder="Google Maps link"
                readOnly
              />
              <button
                type="button"
                onClick={getLocation}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Get GPS
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Save Address
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{addr.name}</h3>
                {addr.age && <p className="text-gray-600">Age: {addr.age}</p>}
                {addr.family && <p className="text-gray-600">Family: {addr.family}</p>}
                <p className="text-gray-600">{addr.address}</p>
              </div>
              {addr.location_string && (
                <a
                  href={addr.location_string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Maps
                </a>
              )}
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
          <p className="text-center text-gray-500 py-8">No addresses yet. Add one!</p>
        )}
      </div>
    </div>
  );
}
