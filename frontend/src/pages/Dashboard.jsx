import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scan, user } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalScans: 0,
    completedScans: 0,
    lastScan: null,
    averageScore: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch user profile
        const profileData = await user.getProfile();
        setUserProfile(profileData);
        
        // Fetch dashboard stats
        const dashboardStats = await scan.getDashboardStats();
        setStats(dashboardStats);
        
        // Fetch recent scans
        const history = await scan.getScanHistory();
        setRecentScans(history.scans?.slice(0, 5) || []);
        
        setLoading(false);
      } catch (err) {
        setError(err.error || 'Dashboardni yuklashda xatolik yuz berdi');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Yakunlangan
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Jarayonda
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Xatolik
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Xatolik</h2>
          <p className="text-red-700">{error}</p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900">
            Asosiy sahifaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Xush kelibsiz, {userProfile?.name || 'Foydalanuvchi'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Dashboard orqali saytingiz xavfsizligini nazorat qiling
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/" className="inline-block px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
              <i className="fas fa-search mr-2"></i> Yangi tekshiruv boshlash
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-blue-100">
              <i className="fas fa-search text-blue-800 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Jami tekshiruvlar</h3>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalScans}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-green-100">
              <i className="fas fa-check text-green-800 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Yakunlangan tekshiruvlar</h3>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.completedScans}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-yellow-100">
              <i className="fas fa-shield-alt text-yellow-800 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">O'rtacha xavfsizlik bahosi</h3>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.averageScore ? `${stats.averageScore}%` : 'Mavjud emas'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-purple-100">
              <i className="fas fa-clock text-purple-800 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Oxirgi tekshiruv</h3>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {stats.lastScan 
                  ? new Date(stats.lastScan.created_at).toLocaleString() 
                  : 'Hech qanday tekshiruv topilmadi'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">Oxirgi tekshiruvlar</h3>
        </div>
        
        {recentScans.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">Hech qanday tekshiruv mavjud emas.</p>
            <Link to="/" className="inline-block mt-4 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
              <i className="fas fa-search mr-2"></i> Tekshiruvni boshlash
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL manzil
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sana
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holat
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium truncate max-w-xs">{scan.url}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{new Date(scan.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(scan.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {scan.status === 'completed' ? (
                        <Link to={`/scan/${scan.id}`} className="text-blue-800 hover:text-blue-900 mr-4">
                          <i className="fas fa-eye mr-1"></i> Ko'rish
                        </Link>
                      ) : scan.status === 'in_progress' ? (
                        <Link to={`/scan/${scan.id}`} className="text-blue-800 hover:text-blue-900 mr-4">
                          <i className="fas fa-spinner fa-spin mr-1"></i> Tekshirish
                        </Link>
                      ) : (
                        <span className="text-gray-400 cursor-not-allowed">
                          <i className="fas fa-eye-slash mr-1"></i> Mavjud emas
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {recentScans.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Link to="/history" className="text-blue-800 hover:text-blue-900 font-medium">
              <i className="fas fa-history mr-1"></i> Barcha tekshiruvlarni ko'rish
            </Link>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Xavfsizlik bo'yicha maslahatlar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Muntazam tekshiruvlar</h4>
            <p className="text-blue-700 text-sm">
              Saytingizni muntazam tekshirib turing. Kamida oyda bir marta tekshirish tavsiya etiladi.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <h4 className="font-medium text-green-800 mb-2">Yangilanishlar</h4>
            <p className="text-green-700 text-sm">
              CMS va plaginyangizni doimo yangilang. Eskirgan versiyalar xavfsizlik zaifliklariga ega bo'lishi mumkin.
            </p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <h4 className="font-medium text-yellow-800 mb-2">Kuchli parollar</h4>
            <p className="text-yellow-700 text-sm">
              Har doim murakkab parollardan foydalaning va ularni muntazam o'zgartirib turing.
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <h4 className="font-medium text-purple-800 mb-2">Zaxira nusxalash</h4>
            <p className="text-purple-700 text-sm">
              Saytingizning muntazam zaxira nusxasini saqlang, bu falokatdan keyin tiklashning eng yaxshi usuli.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 