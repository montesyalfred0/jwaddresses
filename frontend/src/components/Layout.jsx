import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, LogOut, ChevronRight, Home } from 'lucide-react';
import { InstallButton, IosInstallBanner } from './InstallPrompt';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => {
    const path = '/' + pathParts.slice(0, i + 1).join('/');
    const label = part === 'territories' ? 'Territories' : '';
    return { path, label };
  }).filter(b => b.label);

  return (
    <div className="min-h-screen bg-jwbg">
      <nav className="bg-jw-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/territories" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <MapPin className="w-5 h-5" />
            <span className="text-lg font-semibold tracking-tight">JW Addresses</span>
          </Link>
          <div className="flex items-center gap-2">
            <InstallButton />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-jw-800 hover:bg-jw-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </nav>

      <IosInstallBanner />

      {breadcrumbs.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-2.5 flex items-center gap-1 text-sm">
            <Link to="/territories" className="flex items-center gap-1 text-jwtextm hover:text-jw-700 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                {i < breadcrumbs.length - 1 ? (
                  <Link to={crumb.path} className="text-jwtextm hover:text-jw-700 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-jwtext font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
