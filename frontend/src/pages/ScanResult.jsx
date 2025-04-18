import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scan, report } from '../services/api';

const ScanResult = () => {
  const { scanId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await scan.getScanResult(scanId);
        setResult(response.result);
        setLoading(false);
      } catch (err) {
        setError(err.error || 'Natijalarni yuklashda xatolik yuz berdi');
        setLoading(false);
      }
    };

    fetchResult();
  }, [scanId]);

  const handleDownload = () => {
    report.exportReport(scanId);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          progress: 'bg-red-600'
        };
      case 'medium':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200',
          progress: 'bg-orange-500'
        };
      case 'low':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          progress: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          progress: 'bg-gray-600'
        };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-600';
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

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Natija topilmadi</h2>
          <p className="text-yellow-700">Kechirasiz, so'ralgan skanerlash natijasi topilmadi.</p>
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
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-file-alt text-blue-800 mr-2 text-xl"></i>
            <h3 className="font-bold text-lg text-gray-900">Zaiflik skaneri hisoboti</h3>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Skanerlash sanasi: {new Date(result.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Sayt ma'lumotlari</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">URL manzil:</p>
                <p className="text-gray-900 font-medium">{result.url}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Server turi:</p>
                <p className="text-gray-900 font-medium">{result.server_info.server}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Operatsion tizim:</p>
                <p className="text-gray-900 font-medium">{result.server_info.os}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Aniqlangan zaifliklar:</p>
                <p className="text-gray-900 font-medium">
                  {result.vulnerabilities.length} ta (
                  {result.severity_counts.high} ta yuqori, 
                  {result.severity_counts.medium} ta o'rta,
                  {result.severity_counts.low} ta past darajali)
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Aniqlangan zaifliklar</h4>
            
            {result.vulnerabilities.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <h5 className="font-medium text-green-800">Zaiflik topilmadi</h5>
                <p className="text-green-700 mt-2">Tabriklaymiz! Saytingizda hech qanday zaiflik topilmadi.</p>
              </div>
            ) : (
              result.vulnerabilities.map((vuln) => {
                const colors = getSeverityColor(vuln.severity);
                
                return (
                  <div key={vuln.id} className={`border ${colors.border} rounded-lg mb-4 overflow-hidden`}>
                    <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${colors.bg} ${colors.text} mr-2`}>
                          <i className="fas fa-exclamation-circle text-xs"></i>
                        </span>
                        <h5 className="font-medium text-gray-900">{vuln.name}</h5>
                      </div>
                      <span className={`px-2 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}>
                        {vuln.severity === 'high' ? 'Yuqori' : vuln.severity === 'medium' ? 'O\'rta' : 'Past'}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Tavsif:</p>
                        <p className="text-gray-700">{vuln.description}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Aniqlangan vaqt:</p>
                        <p className="text-gray-700">{new Date(vuln.detected_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Xavfsizlik darajasi</h4>
            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Umumiy xavfsizlik bahosi</span>
                <span className={`text-sm font-medium ${result.security_score < 60 ? 'text-red-600' : result.security_score < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                  {result.security_score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`${getScoreColor(result.security_score)} h-2.5 rounded-full`} style={{ width: `${result.security_score}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Yuqori darajali zaifliklar</span>
                  <span className="text-sm font-medium text-red-600">{result.severity_counts.high}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${Math.min(result.severity_counts.high * 20, 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">O'rta darajali zaifliklar</span>
                  <span className="text-sm font-medium text-orange-500">{result.severity_counts.medium}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${Math.min(result.severity_counts.medium * 15, 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Past darajali zaifliklar</span>
                  <span className="text-sm font-medium text-yellow-500">{result.severity_counts.low}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${Math.min(result.severity_counts.low * 10, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Xulosa va tavsiyalar</h4>
            <p className="text-gray-700 mb-4">
              {result.vulnerabilities.length > 0 
                ? `Ushbu tekshirish natijasida web ilovangizda ${result.vulnerabilities.length} ta xavfsizlik zaiflik aniqlandi.` +
                  (result.severity_counts.high > 0 ? ' Yuqori darajali zaifliklarni tezda bartaraf etish tavsiya etiladi.' : '') +
                  ' Quyidagi umumiy tavsiyalarga amal qilish orqali xavfsizlik darajasini oshirishingiz mumkin:'
                : 'Tabriklaymiz! Saytingizda hech qanday zaiflik topilmadi. Quyidagi tavsiyalarga amal qilish orqali xavfsizlik darajasini yanada oshirishingiz mumkin:'}
            </p>
            <ul className="list-disc pl-5 text-gray-700 mb-4">
              <li className="mb-1">Barcha foydalanuvchi kiritadigan ma'lumotlarni tekshiring va tozalang</li>
              <li className="mb-1">Dastur kodini muntazam ravishda yangilab turing</li>
              <li className="mb-1">SSL/TLS sertifikatini o'rnating va HTTPS protokolidan foydalaning</li>
              <li className="mb-1">Xavfsizlik headerlarini to'g'ri sozlang</li>
              <li className="mb-1">Barcha administrator va foydalanuvchi hisoblarida kuchli parollardan foydalaning</li>
            </ul>
            <div className="flex justify-center">
              <button 
                onClick={handleDownload}
                className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-lg mr-4"
              >
                <i className="fas fa-download mr-2"></i> Hisobotni yuklab olish
              </button>
              <Link to="/" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg">
                <i className="fas fa-home mr-2"></i> Asosiy sahifaga qaytish
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult; 