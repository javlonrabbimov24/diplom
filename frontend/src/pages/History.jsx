import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scan } from '../services/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    const fetchHistory = async () => {
      try {
        const response = await scan.getScanHistory();
        setHistory(response.scans || []);
        setLoading(false);
      } catch (err) {
        setError(err.error || 'Tarixni yuklashda xatolik yuz berdi');
        setLoading(false);
      }
    };

    fetchHistory();
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

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return null;
    }
    
    let colorClass = 'bg-gray-100 text-gray-800';
    if (score >= 80) {
      colorClass = 'bg-green-100 text-green-800';
    } else if (score >= 60) {
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
      colorClass = 'bg-red-100 text-red-800';
    }
    
    return (
      <span className={`px-2 py-1 ${colorClass} rounded-full text-xs font-medium`}>
        {score}%
      </span>
    );
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
      <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">Sayt tekshiruvlari tarixi</h3>
          {!isLoggedIn && (
            <p className="text-sm text-gray-600 mt-2">
              <i className="fas fa-info-circle mr-1"></i>
              Ro'yxatdan o'ting yoki tizimga kiring barcha tekshiruvlaringizni saqlash uchun.
            </p>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-800 mb-4">
              <i className="fas fa-history text-xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hech qanday tekshiruv topilmadi</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              {isLoggedIn 
                ? "Siz hali hech qanday sayt tekshiruvini amalga oshirmagansiz." 
                : "Tekshiruv tarixini ko'rish uchun bepul ro'yxatdan o'ting."}
            </p>
            <Link to="/" className="inline-block px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
              <i className="fas fa-search mr-2"></i> Yangi tekshiruv boshlash
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
                    Xavfsizlik bahosi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((scan) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {scan.status === 'completed' ? getScoreBadge(scan.security_score) : '-'}
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
      </div>
      
      {history.length > 0 && (
        <div className="mt-6 text-center">
          <Link to="/" className="inline-block px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
            <i className="fas fa-search mr-2"></i> Yangi tekshiruv boshlash
          </Link>
        </div>
      )}
    </div>
  );
};

export default History; 