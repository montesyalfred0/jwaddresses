import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { territoryAPI } from '../services/api';
import { Map, ChevronRight, MapPin, AlertTriangle, RefreshCw, Search } from 'lucide-react';

const territoryColors = [
  'bg-jw-50 text-jw-700 border-jw-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-teal-50 text-teal-700 border-teal-200',
];

export default function TerritoryList() {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTerritories = useMemo(() => {
    if (!searchQuery.trim()) return territories;
    const q = searchQuery.toLowerCase();
    return territories.filter(t =>
      t.neighborhoods?.some(nb =>
        nb?.name?.toLowerCase().includes(q)
      )
    );
  }, [territories, searchQuery]);

  useEffect(() => {
    const fetchTerritories = async () => {
      try {
        const { data } = await territoryAPI.getTerritories();
        setTerritories(data);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to load territories');
        setLoading(false);
      }
    };
    fetchTerritories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-jw-700 border-t-transparent rounded-full animate-spin-slow" />
        <p className="mt-4 text-jwtextm text-sm">Cargando territorios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-jw-700 text-white px-5 py-2.5 rounded-lg hover:bg-jw-800 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  if (territories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Map className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-jwtext mb-1">No se encontraron territorios</h2>
        <p className="text-jwtextm text-sm">Los territorios aparecerán aquí cuando estén configurados.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-jw-700 rounded-lg">
            <Map className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-jwtext">Territorios</h1>
        </div>
        <p className="text-jwtextm text-sm ml-14">Seleccione un barrio para gestionar las direcciones</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4"
          placeholder="Buscar barrio..."
        />
      </div>

      {filteredTerritories.length === 0 && searchQuery.trim() && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <Search className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-jwtextm font-medium">No se encontraron barrios</p>
          <p className="text-gray-400 text-sm mt-1">Intente con otro término de búsqueda</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredTerritories.map((territory, idx) => {
          const neighborhoods = territory.neighborhoods?.filter(nb => nb?.id) || [];
          return (
            <div
              key={territory.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className="p-5 pb-3">
                <div className="flex items-center gap-2.5 mb-3">
                  <MapPin className="w-4 h-4 text-jw-700" />
                  <h2 className="text-lg font-semibold text-jwtext">{territory.name}</h2>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${territoryColors[idx % territoryColors.length]}`}>
                  {neighborhoods.length} {neighborhoods.length === 1 ? 'barrio' : 'barrios'}
                </span>
              </div>

              <div className="border-t border-gray-50 divide-y divide-gray-50">
                {neighborhoods.map((nb) => (
                  <Link
                    key={nb.id}
                    to={`/neighborhood/${nb.id}`}
                    state={{ neighborhoodName: nb.name }}
                    className="flex items-center justify-between px-5 py-3 hover:bg-jw-50 transition-colors group"
                  >
                    <span className="text-sm text-jwtext group-hover:text-jw-700 font-medium transition-colors">
                      {nb.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-jw-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
