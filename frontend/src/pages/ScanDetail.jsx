import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Clock, 
  Globe, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Download,
  ArrowLeft
} from 'lucide-react';
import { scan } from '../services/api';
import { toast } from 'react-hot-toast';

const ScanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scanData, setScanData] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVulnerability, setExpandedVulnerability] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // ID parametrini tekshirish
    if (!id || id === 'undefined') {
      console.error('Invalid scan ID:', id);
      setError('Noto\'g\'ri skanerlash ID raqami.');
      setTimeout(() => {
        navigate('/');  // Redirect to home page
      }, 1000);
      return;
    }

    const fetchScanDetails = async () => {
      try {
        setLoading(true);
        const data = await scan.getScanById(id);
        setScanData(data);
        
        // Calculate progress
        const calculatedProgress = scan.calculateScanProgress(data);
        setProgress(calculatedProgress);
        
        // If scan is in progress or queued, start polling
        if (data.status === 'in_progress' || data.status === 'queued') {
          // If not already polling, start polling
          if (!pollingInterval) {
            const interval = setInterval(() => fetchUpdatedStatus(), 3000);
            setPollingInterval(interval);
          }
        } 
        // If scan is completed, fetch vulnerabilities and stop polling
        else if (data.status === 'completed') {
          clearPollingInterval();
          try {
            const vulnData = await scan.getVulnerabilities(id);
            setVulnerabilities(vulnData);
          } catch (vulnErr) {
            console.error('Error fetching vulnerabilities:', vulnErr);
          }
          
          // Generate report if not already generated
          try {
            await scan.generateReport(id);
          } catch (reportErr) {
            console.error('Error generating report:', reportErr);
          }
        } 
        // If scan failed or was cancelled, stop polling
        else {
          clearPollingInterval();
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching scan details:', err);
        setError('Skanerlash tafsilotlari yuklanmadi. Iltimos, qayta urinib ko\'ring.');
        clearPollingInterval();
      } finally {
        setLoading(false);
      }
    };

    const fetchUpdatedStatus = async () => {
      if (!id || id === 'undefined') {
        console.error('Invalid scan ID for status update:', id);
        clearPollingInterval();
        return;
      }
      
      try {
        const data = await scan.getScanById(id);
        setScanData(data);
        
        // Update progress
        const calculatedProgress = scan.calculateScanProgress(data);
        setProgress(calculatedProgress);
        
        // If scan is completed, fetch vulnerabilities and stop polling
        if (data.status === 'completed') {
          clearPollingInterval();
          try {
            const vulnData = await scan.getVulnerabilities(id);
            setVulnerabilities(vulnData);
          } catch (vulnErr) {
            console.error('Error fetching vulnerabilities:', vulnErr);
          }
          
          // Generate report if not already generated
          try {
            await scan.generateReport(id);
          } catch (reportErr) {
            console.error('Error generating report:', reportErr);
          }
        } 
        // If scan failed or was cancelled, stop polling
        else if (data.status === 'failed' || data.status === 'cancelled') {
          clearPollingInterval();
        }
      } catch (err) {
        console.error('Error polling scan status:', err);
        // If we get multiple polling errors, stop polling
        if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
          clearPollingInterval();
          setError('Skanerlash ma\'lumotlari topilmadi.');
        }
      }
    };

    const clearPollingInterval = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };

    // Only fetch if ID is valid
    if (id && id !== 'undefined') {
      fetchScanDetails();
    }

    // Cleanup: clear polling interval when component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [id, navigate, pollingInterval]);

  const toggleVulnerabilityDetails = (vulnId) => {
    if (expandedVulnerability === vulnId) {
      setExpandedVulnerability(null);
    } else {
      setExpandedVulnerability(vulnId);
    }
  };

  const handleDownloadReport = async () => {
    // Only attempt download if ID is valid
    if (!id || id === 'undefined') {
      toast.error('Hisobot ID raqami noto\'g\'ri');
      return;
    }
    
    try {
      setIsDownloading(true);
      // Use a download format of PDF
      await scan.getScanReport(id, 'pdf');
      setIsDownloading(false);
    } catch (err) {
      console.error('Hisobot yuklab olishda xatolik:', err);
      setIsDownloading(false);
      toast.error('Hisobotni yuklab olishda xatolik yuz berdi');
    }
  };

  const getSecurityScoreBadge = (score) => {
    if (score >= 80) {
      return (
        <div className="flex items-center">
          <Shield className="text-green-500 mr-2" size={24} />
          <span className="text-2xl font-bold text-green-600">{score}</span>
        </div>
      );
    } else if (score >= 50) {
      return (
        <div className="flex items-center">
          <Shield className="text-yellow-500 mr-2" size={24} />
          <span className="text-2xl font-bold text-yellow-600">{score}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <Shield className="text-red-500 mr-2" size={24} />
          <span className="text-2xl font-bold text-red-600">{score}</span>
        </div>
      );
    }
  };

  const getSeverityBadge = (severity) => {
    const severityMap = {
      critical: { class: 'bg-red-100 text-red-800', text: 'Kritik' },
      high: { class: 'bg-orange-100 text-orange-800', text: 'Yuqori' },
      medium: { class: 'bg-yellow-100 text-yellow-800', text: 'O\'rta' },
      low: { class: 'bg-blue-100 text-blue-800', text: 'Past' },
      info: { class: 'bg-gray-100 text-gray-800', text: 'Ma\'lumot' }
    };

    const severityInfo = severityMap[severity.toLowerCase()] || { class: 'bg-gray-100 text-gray-800', text: severity };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityInfo.class}`}>
        {severityInfo.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { class: 'bg-green-100 text-green-800', text: 'Yakunlangan', icon: <CheckCircle size={16} className="mr-1" /> },
      in_progress: { class: 'bg-blue-100 text-blue-800', text: 'Jarayonda', icon: <Clock size={16} className="mr-1" /> },
      queued: { class: 'bg-yellow-100 text-yellow-800', text: 'Navbatda', icon: <Clock size={16} className="mr-1" /> },
      failed: { class: 'bg-red-100 text-red-800', text: 'Muvaffaqiyatsiz', icon: <XCircle size={16} className="mr-1" /> },
      cancelled: { class: 'bg-gray-100 text-gray-800', text: 'Bekor qilingan', icon: <XCircle size={16} className="mr-1" /> }
    };

    const statusInfo = statusMap[status] || { class: 'bg-gray-100 text-gray-800', text: status, icon: null };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${statusInfo.class}`}>
        {statusInfo.icon}
        {statusInfo.text}
      </span>
    );
  };

  // Filter vulnerabilities based on current filters
  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const matchesSeverity = severityFilter === 'all' || vuln.severity.toLowerCase() === severityFilter;
    const matchesStatus = statusFilter === 'all' || vuln.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-xl font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg relative" role="alert">
          <strong className="font-bold text-lg mb-2 block">Xatolik! </strong>
          <p className="block sm:inline">{error}</p>
          <div className="mt-4">
            <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center">
              <ArrowLeft size={18} className="mr-2" /> Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg relative" role="alert">
          <strong className="font-bold text-lg mb-2 block">Topilmadi! </strong>
          <p className="block sm:inline">So'ralgan skanerlash ma'lumotlari topilmadi.</p>
          <div className="mt-4">
            <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center">
              <ArrowLeft size={18} className="mr-2" /> Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link to="/" className="text-blue-600 hover:text-blue-800 mr-4 flex items-center">
          <ArrowLeft size={18} className="mr-1" /> Bosh sahifaga qaytish
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold mb-2 md:mb-0">Skanerlash tafsilotlari</h1>
            {scanData.status === 'completed' && (
              <button 
                onClick={handleDownloadReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download size={18} className="mr-2" /> Hisobotni yuklab olish
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 flex-1">
              <div className="text-sm text-blue-600 mb-1">Manzil URL</div>
              <div className="flex items-center text-lg font-medium">
                <Globe size={18} className="mr-2 text-blue-600" /> 
                <a href={scanData.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline truncate">
                  {scanData.targetUrl}
                </a>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 flex-1">
              <div className="text-sm text-gray-600 mb-1">Holati</div>
              <div className="flex items-center">
                {getStatusBadge(scanData.status)}
              </div>
            </div>
            
            {scanData.status === 'completed' && scanData.securityScore !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4 flex-1">
                <div className="text-sm text-gray-600 mb-1">Xavfsizlik bali</div>
                {getSecurityScoreBadge(scanData.securityScore)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Boshlangan vaqti</div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-600" />
                <span>{scanData.createdAt ? format(new Date(scanData.createdAt), 'MMM d, yyyy HH:mm:ss') : 'Mavjud emas'}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Yakunlangan vaqti</div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-600" />
                <span>{scanData.completedAt ? format(new Date(scanData.completedAt), 'MMM d, yyyy HH:mm:ss') : 'Yakunlanmagan'}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Davomiyligi</div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-600" />
                <span>
                  {scanData.completedAt && scanData.createdAt ? 
                    (() => {
                      const duration = new Date(scanData.completedAt) - new Date(scanData.createdAt);
                      const minutes = Math.floor(duration / 60000);
                      const seconds = Math.floor((duration % 60000) / 1000);
                      return `${minutes}m ${seconds}s`;
                    })() : 
                    scanData.status === 'in_progress' ? 'Hisoblanyapti...' : 'Mavjud emas'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Umumiy ma'lumot
              </button>
              <button
                onClick={() => setActiveTab('vulnerabilities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vulnerabilities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Zaifliklar {vulnerabilities.length > 0 && `(${vulnerabilities.length})`}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Skanerlash xulosasi</h2>
              
              {scanData.status === 'completed' ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-red-700 mb-1">
                        {vulnerabilities.filter(v => ['critical', 'high'].includes(v.severity.toLowerCase())).length}
                      </div>
                      <div className="text-sm text-red-600">Kritik/Yuqori zaifliklar</div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-yellow-700 mb-1">
                        {vulnerabilities.filter(v => v.severity.toLowerCase() === 'medium').length}
                      </div>
                      <div className="text-sm text-yellow-600">O'rta darajali zaifliklar</div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-blue-700 mb-1">
                        {vulnerabilities.filter(v => ['low', 'info'].includes(v.severity.toLowerCase())).length}
                      </div>
                      <div className="text-sm text-blue-600">Past/Ma'lumot darajali zaifliklar</div>
                    </div>
                  </div>
                  
                  {scanData.summary && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="font-medium mb-2">Xulosa</h3>
                      <p className="text-gray-700">{scanData.summary}</p>
                    </div>
                  )}
                  
                  {scanData.recommendations && scanData.recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Tavsiyalar</h3>
                      <ul className="list-disc pl-5 text-gray-700">
                        {scanData.recommendations.map((rec, index) => (
                          <li key={index} className="mb-1">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  {scanData.status === 'in_progress' && (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-48 h-48 mb-6">
                        <div className="absolute inset-0 rounded-full border-8 border-blue-200"></div>
                        <div 
                          className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 animate-spin"
                          style={{ animationDuration: '2s' }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-blue-700 text-lg font-bold">{Math.round(progress)}%</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-4 text-blue-800">Skanerlash jarayonda</h3>
                      <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="space-y-2 text-left bg-white p-4 rounded-lg shadow-sm w-full max-w-md">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                          <p className="text-gray-700">URL tekshirilmoqda: {scanData.targetUrl}</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                          <p className="text-gray-700">Server ma'lumotlari yig'ilmoqda</p>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${progress > 30 ? 'bg-green-500' : 'bg-blue-500 animate-pulse'} mr-2`}></div>
                          <p className="text-gray-700">Zaifliklarni qidirilmoqda{progress <= 50 ? '...' : ''}</p>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${progress > 80 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'} mr-2`}></div>
                          <p className="text-gray-700">Hisobotni tayyorlanmoqda{progress > 80 ? '...' : ''}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-6">
                        Skanerlash jarayoni bir necha daqiqa davom etishi mumkin. Sahifa avtomatik yangilanib boradi.
                      </p>
                    </div>
                  )}

                  {scanData.status === 'queued' && (
                    <div className="flex flex-col items-center">
                      <div className="bg-yellow-100 p-4 rounded-full mb-4">
                        <Clock size={48} className="text-yellow-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Skanerlash navbatda</h3>
                      <p className="text-gray-600 mb-4 text-center">
                        Sizning so'rovingiz navbatga qo'yildi va tez orada boshlanadi.
                        <br />Iltimos, kutib turing. Sahifa avtomatik yangilanadi.
                      </p>
                      <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-yellow-500 rounded-full animate-pulse" style={{ width: '5%' }}></div>
                      </div>
                      <p className="text-sm text-gray-500">Taxminiy kutish vaqti: 30 soniya</p>
                    </div>
                  )}

                  {scanData.status === 'failed' && (
                    <div className="flex flex-col items-center">
                      <AlertTriangle size={48} className="text-red-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Skanerlash muvaffaqiyatsiz tugadi</h3>
                      <p className="text-gray-600 mb-4">
                        Skanerlash jarayonida xatolik yuz berdi va yakunlanmadi.
                      </p>
                      <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Yangi skanerlash boshlash
                      </Link>
                    </div>
                  )}
                  
                  {scanData.status === 'cancelled' && (
                    <div className="flex flex-col items-center">
                      <XCircle size={48} className="text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Skanerlash bekor qilindi</h3>
                      <p className="text-gray-600 mb-4">
                        Skanerlash jarayoni bekor qilindi.
                      </p>
                      <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Yangi skanerlash boshlash
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Zaifliklar</h2>
              
              {scanData.status !== 'completed' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Zaifliklar haqida ma'lumot mavjud emas</h3>
                  <p className="text-gray-600">
                    Zaifliklar haqidagi ma'lumotlar skanerlash yakunlangandan so'ng ko'rsatiladi.
                  </p>
                </div>
              ) : vulnerabilities.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Zaifliklar topilmadi</h3>
                  <p className="text-gray-600">
                    Ajoyib yangilik! Ushbu skanerlash davomida xavfsizlik zaifliklari aniqlanmadi.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="border rounded-lg px-4 py-2"
                    >
                      <option value="all">Barcha darajalar</option>
                      <option value="critical">Kritik</option>
                      <option value="high">Yuqori</option>
                      <option value="medium">O'rta</option>
                      <option value="low">Past</option>
                      <option value="info">Ma'lumot</option>
                    </select>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border rounded-lg px-4 py-2"
                    >
                      <option value="all">Barcha holatlar</option>
                      <option value="open">Ochiq</option>
                      <option value="fixed">Tuzatilgan</option>
                      <option value="false_positive">Soxta xabar</option>
                      <option value="accepted_risk">Qabul qilingan xavf</option>
                    </select>
                  </div>
                  
                  {filteredVulnerabilities.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Mos keluvchi zaifliklar yo'q</h3>
                      <p className="text-gray-600 mb-4">
                        Joriy filtrlarga mos keladigan zaifliklar topilmadi.
                      </p>
                      <button
                        onClick={() => {
                          setSeverityFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Filtrlarni tozalash
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredVulnerabilities.map((vuln) => (
                        <div key={vuln.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                            onClick={() => toggleVulnerabilityDetails(vuln.id)}
                          >
                            <div className="flex items-center space-x-4">
                              <div>
                                {getSeverityBadge(vuln.severity)}
                              </div>
                              <div className="font-medium">{vuln.title || vuln.name}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {vuln.status && (
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                  {vuln.status}
                                </span>
                              )}
                              {expandedVulnerability === vuln.id ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </div>
                          </div>
                          
                          {expandedVulnerability === vuln.id && (
                            <div className="p-4 border-t">
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Tavsif</h4>
                                <p className="text-gray-700">{vuln.description}</p>
                              </div>
                              
                              {vuln.location && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Joylashuvi</h4>
                                  <p className="text-gray-700 font-mono text-sm bg-gray-50 p-2 rounded">{vuln.location}</p>
                                </div>
                              )}
                              
                              {vuln.impact && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Ta'siri</h4>
                                  <p className="text-gray-700">{vuln.impact}</p>
                                </div>
                              )}
                              
                              {vuln.remediation && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Tuzatish yo'llari</h4>
                                  <p className="text-gray-700">{vuln.remediation}</p>
                                </div>
                              )}
                              
                              {vuln.cvss && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">CVSS bali</h4>
                                  <p className="text-gray-700">{vuln.cvss}</p>
                                </div>
                              )}
                              
                              {vuln.references && vuln.references.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Manbalar</h4>
                                  <ul className="list-disc pl-5">
                                    {vuln.references.map((ref, index) => (
                                      <li key={index} className="mb-1">
                                        <a 
                                          href={ref} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {ref}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanDetail; 