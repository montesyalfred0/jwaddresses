import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { addressAPI, exportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, User, Users, Home, Navigation, Save,
  ExternalLink, Plus, ArrowLeft, AlertTriangle, CheckCircle,
  Clock, Pencil, Trash2, Download,
} from 'lucide-react';
import MapPicker from './MapPicker';

export default function TerritoryDetail() {
  const { neighborhoodId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const neighborhoodName = state?.neighborhoodName || 'Direcciones';
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (showForm) {
      const timer = setTimeout(() => {
        document.getElementById('address-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showForm]);

  useEffect(() => {
    if (editingAddress) {
      setFormData({
        name: editingAddress.name || '',
        age: editingAddress.age?.toString() || '',
        family: editingAddress.family || '',
        address: editingAddress.address || '',
        location_string: editingAddress.location_string || '',
      });
      setShowForm(true);
      setCreateError(null);
    }
  }, [editingAddress]);

  const fetchAddresses = async () => {
    try {
      setFetchError(null);
      const { data } = await addressAPI.getAddresses(neighborhoodId);
      setAddresses(data);
      setLoading(false);
    } catch (error) {
      setFetchError(error.response?.data?.error || 'Failed to load addresses');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (!formData.location_string) {
      setCreateError('Se requiere ubicación. Haga clic en "Seleccionar en mapa" para elegir la ubicación.');
      return;
    }
    setSaving(true);
    try {
      const addressData = {
        name: formData.name,
        address: formData.address,
        location_string: formData.location_string,
        neighborhood_id: parseInt(neighborhoodId),
        ...(formData.age && parseInt(formData.age) > 0 ? { age: parseInt(formData.age) } : {}),
        ...(formData.family?.trim() ? { family: formData.family.trim() } : {}),
      };
      if (editingAddress) {
        await addressAPI.updateAddress(editingAddress.id, addressData);
        setSuccessMsg('Dirección actualizada exitosamente');
      } else {
        await addressAPI.createAddress(addressData);
        setSuccessMsg('Dirección guardada exitosamente');
      }
      setFormData({ name: '', age: '', family: '', address: '', location_string: '' });
      setShowForm(false);
      setEditingAddress(null);
      setCreateError(null);
      setSaving(false);
      fetchAddresses();
    } catch (error) {
      setSaving(false);
      const errData = error.response?.data;
      if (Array.isArray(errData?.error)) {
        setCreateError(errData.error.map(e => e.message).join(', '));
      } else {
        setCreateError(errData?.error || 'Failed to save address');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await addressAPI.deleteAddress(id);
      setDeleting(false);
      setDeletingId(null);
      setSuccessMsg('Dirección eliminada exitosamente');
      fetchAddresses();
    } catch (error) {
      setDeleting(false);
      setErrorMsg(error.response?.data?.error || 'Error al eliminar la dirección');
    }
  };

  const handleDownloadTerritory = async () => {
    setDownloading(true);
    try {
      await exportAPI.downloadTerritoryFromNeighborhood(neighborhoodId);
      setSuccessMsg('Documento generado exitosamente');
    } catch (error) {
      setErrorMsg(error.message || 'Error al generar el documento');
    } finally {
      setDownloading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setFormData({ name: '', age: '', family: '', address: '', location_string: '' });
    setShowForm(false);
    setCreateError(null);
  };

  const handleLocationConfirm = (locationUrl) => {
    setFormData({ ...formData, location_string: locationUrl });
    setShowMapPicker(false);
    setCreateError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-jw-700 border-t-transparent rounded-full animate-spin-slow" />
        <p className="mt-4 text-jwtextm text-sm">Cargando direcciones...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium mb-4">{fetchError}</p>
        <button
          onClick={fetchAddresses}
          className="bg-jw-700 text-white px-5 py-2.5 rounded-lg hover:bg-jw-800 transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-32 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <Link
        to="/territories"
        className="inline-flex items-center gap-1.5 text-jwtextm hover:text-jw-700 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Territorios
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-jw-700" />
            <h1 className="text-2xl font-bold text-jwtext">{neighborhoodName}</h1>
          </div>
          <p className="text-jwtextm text-sm mt-1 ml-7">
            {addresses.length} {addresses.length === 1 ? 'dirección registrada' : 'direcciones registradas'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadTerritory}
              disabled={downloading}
              className="flex items-center gap-2 border border-jw-700 text-jw-700 px-4 py-2.5 rounded-lg hover:bg-jw-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
              title="Descargar todas las direcciones de este territorio en Word"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Descargar (.docx)
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (editingAddress) {
                  handleCancelEdit();
                } else {
                  setShowForm(!showForm);
                  setCreateError(null);
                }
              }}
              className="flex items-center gap-2 bg-jw-700 text-white px-5 py-2.5 rounded-lg hover:bg-jw-800 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancelar' : 'Agregar Dirección'}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form
          id="address-form"
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-slide-up"
        >
          <h2 className="text-lg font-semibold text-jwtext mb-5 flex items-center gap-2">
            <Home className="w-4 h-4 text-jw-700" />
            {editingAddress ? (
              <span>Editando: <span className="text-jw-700">{editingAddress.name}</span></span>
            ) : 'Nueva Dirección'}
          </h2>
          {editingAddress && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm text-jw-700 hover:text-jw-800 underline mb-3"
            >
              Cancelar edición
            </button>
          )}

          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5 animate-fade-in">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full"
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Edad</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full"
                placeholder="Opcional"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Familia</label>
              <input
                type="text"
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                className="w-full"
                placeholder="ej. mamá martha delgado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full"
                placeholder="Dirección completa"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubicación</label>
            <div className="flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={formData.location_string}
                onChange={(e) => setFormData({ ...formData, location_string: e.target.value })}
                className="flex-1"
                placeholder="Enlace de Google Maps"
              />
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Navigation className="w-4 h-4" />
                Seleccionar en mapa
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 flex items-center gap-2 bg-jw-700 text-white px-6 py-2.5 rounded-lg hover:bg-jw-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingAddress ? 'Actualizar Dirección' : 'Guardar Dirección'}
              </>
            )}
          </button>
        </form>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 animate-fade-in">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-jwtextm font-medium">Aún no hay direcciones</p>
          <p className="text-gray-400 text-sm mt-1">Haga clic en "Agregar Dirección" para registrar la primera</p>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="mt-0.5 p-1.5 bg-jw-50 rounded-lg flex-shrink-0">
                  <User className="w-4 h-4 text-jw-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-jwtext">{addr.name}</h3>
                  <div className="mt-1.5 space-y-1">
                    {addr.family && (
                      <p className="text-sm text-jwtextm flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {addr.family}
                      </p>
                    )}
                    {addr.age && (
                      <p className="text-sm text-jwtextm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        Edad: {addr.age}
                      </p>
                    )}
                    <p className="text-sm text-jwtextm flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {addr.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && deletingId === addr.id ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                    {deleting ? (
                      <div className="flex items-center gap-1.5">
                        <svg className="animate-spin w-3.5 h-3.5 text-red-700" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs font-medium text-red-700">Eliminando...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-red-700 whitespace-nowrap">¿Eliminar?</span>
                        <button
                          onClick={() => handleDelete(addr.id)}
                          className="text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs font-semibold text-jwtextm hover:text-jwtext transition-colors"
                        >
                          No
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {addr.location_string && (
                      <a
                        href={addr.location_string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-jw-50 text-jw-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-jw-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Maps
                      </a>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => { setEditingAddress(addr); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-jw-700 hover:bg-jw-50 rounded-lg transition-colors"
                          title="Editar dirección"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(addr.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar dirección"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={formData.location_string}
      />
    </div>
  );
}
