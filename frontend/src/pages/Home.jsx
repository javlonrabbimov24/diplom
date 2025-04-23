import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scan } from '../services/api';
import { toast } from 'react-hot-toast';

const Home = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartScan = async (e) => {
    e.preventDefault();
    
    // Trim URL to remove whitespace
    const trimmedUrl = url.trim();
    
    // Basic URL validation
    if (!trimmedUrl) {
      toast.error('URL kiritilishi shart');
      return;
    }
    
    // Add http:// prefix if not present
    let formattedUrl = trimmedUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'http://' + formattedUrl;
      setUrl(formattedUrl);
    }
    
    try {
      setIsScanning(true);
      setErrorMessage('');
      
      // Start the scan
      const response = await scan.startScan(formattedUrl);
      
      // Check if we have a valid scan ID in the response
      if (response && response.scan && response.scan.id) {
        // Store scan ID
        const newScanId = response.scan.id;
        console.log('Scan started with ID:', newScanId);
        
        // Redirect to the scan detail page
        navigate(`/scan/${newScanId}`);
      } else {
        console.error('Invalid response from server:', response);
        setErrorMessage('Serverdan noto\'g\'ri javob: scan ID ma\'lumoti yo\'q');
        setIsScanning(false);
        toast.error('Skanerlash boshlanishida xatolik');
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      setErrorMessage(error.message || 'Skanerlash boshlanishida xatolik');
      setIsScanning(false);
      toast.error(error.message || 'Skanerlash boshlanishida xatolik');
    }
  };

  // Define the PHP code examples
  const phpCodeSample1 = `// Xato usul:
$query = "SELECT * FROM users WHERE username = '" . $_GET['username'] . "';";

// To'g'ri usul:
$stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
$stmt->bind_param("s", $_GET['username']);
$stmt->execute();`;

  const phpCodeSample2 = `// PHP da:
$safe_comment = htmlspecialchars($_POST['comment'], ENT_QUOTES, 'UTF-8');

// JavaScript da:
const safeComment = document.createTextNode(userComment);
commentDiv.appendChild(safeComment); // innerHTML ishlatmang`;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 opacity-90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block">Web saytingiz</span>
              <span className="block text-yellow-400">xavfsizligini tekshiring</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300">
              O'zbek tilidagi zaiflik skaneri orqali web saytingizning xavfsizligini tekshiring va xakerlardan himoyalaning
            </p>
            <div className="mt-10 max-w-lg mx-auto">
              <form onSubmit={handleStartScan} className="flex flex-col md:flex-row justify-center gap-2">
                <input 
                  type="text" 
                  className="flex-1 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-300 focus:outline-none" 
                  placeholder="Web sayt manzilini kiriting (https://...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScanning}
                  required
                />
                <button 
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-md flex items-center justify-center transition-all duration-300"
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Tekshirish boshlanmoqda...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Tekshirishni boshlash
                    </>
                  )}
                </button>
              </form>
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mt-2">
                  <p>{errorMessage}</p>
                </div>
              )}
              <p className="text-sm text-gray-300 mt-2">Misol: example.com yoki https://example.uz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Nima uchun CyberShield?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Web saytingiz xavfsizligini tekshirish uchun eng zamonaviy va qulay vosita
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">O'zbek tilidagi interfeys</h3>
              <p className="mt-2 text-base text-gray-600">
                To'liq o'zbek tilidagi interfeys va hisobotlar bilan ishlang. Texnik ma'lumotlarni tushunarli tilda o'qing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sun'iy intellekt tahlili</h3>
              <p className="mt-2 text-base text-gray-600">
                Scan natijalarini sun'iy intellekt tahlili orqali tushunarli tilda taqdim etish imkoniyati.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Batafsil hisobotlar</h3>
              <p className="mt-2 text-base text-gray-600">
                Zaifliklar haqida batafsil ma'lumotlar va ularni bartaraf etish bo'yicha ko'rsatmalar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tezkor skanerlash</h3>
              <p className="mt-2 text-base text-gray-600">
                Tezkor va samarali skanerlash algoritmlari orqali vaqtingizni tejang.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tarixni saqlash</h3>
              <p className="mt-2 text-base text-gray-600">
                Barcha scan natijalari tarixini saqlang va xavfsizlik o'zgarishlarini kuzating.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Bulutli xizmat</h3>
              <p className="mt-2 text-base text-gray-600">
                Hech qanday o'rnatish talab qilinmaydi, faqat brauzer orqali ishlating.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Qanday ishlaydi?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              CyberShield xizmatidan foydalanish oson va qulay
            </p>
          </div>

          <div className="relative">
            {/* Steps connector */}
            <div className="hidden md:block absolute top-1/2 w-full h-0.5 bg-gray-300 transform -translate-y-1/2 z-0"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between">
              {/* Step 1 */}
              <div className="flex flex-col items-center mb-8 md:mb-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-800 text-white mb-4">
                  <span className="text-lg font-bold">1</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sayt manzilini kiriting</h3>
                  <p className="text-base text-gray-600 max-w-xs">
                    Web saytingiz URL manzilini kiritib tekshirishni boshlang
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center mb-8 md:mb-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-800 text-white mb-4">
                  <span className="text-lg font-bold">2</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Skanerlash jarayoni</h3>
                  <p className="text-base text-gray-600 max-w-xs">
                    Tizim avtomatik ravishda saytingizni tekshiradi
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center mb-8 md:mb-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-800 text-white mb-4">
                  <span className="text-lg font-bold">3</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Hisobot olish</h3>
                  <p className="text-base text-gray-600 max-w-xs">
                    Batafsil o'zbek tilidagi hisobotni ko'rib chiqing
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-800 text-white mb-4">
                  <span className="text-lg font-bold">4</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Muammolarni bartaraf etish</h3>
                  <p className="text-base text-gray-600 max-w-xs">
                    Ko'rsatmalarni o'qib zaifliklarni bartaraf eting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Example Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Namuna hisobot</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              CyberShield hisoboti qanday ko'rinishda bo'lishini ko'ring
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-file-alt text-blue-800 mr-2 text-xl"></i>
                <h3 className="font-bold text-lg text-gray-900">Zaiflik skaneri hisoboti</h3>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Skanerlash sanasi: 15.04.2025</span>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Sayt ma'lumotlari</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">URL manzil:</p>
                    <p className="text-gray-900 font-medium">https://example.uz</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Server turi:</p>
                    <p className="text-gray-900 font-medium">Nginx 1.18.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Operatsion tizim:</p>
                    <p className="text-gray-900 font-medium">Ubuntu Linux</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Aniqlangan zaifliklar:</p>
                    <p className="text-gray-900 font-medium">5 ta (2 ta yuqori, 3 ta o'rta darajali)</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Aniqlangan zaifliklar</h4>
                
                {/* Vulnerability 1 */}
                <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-800 mr-2">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                      </span>
                      <h5 className="font-medium text-gray-900">SQL Injection zaiflik</h5>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Yuqori</span>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Tavsif:</p>
                      <p className="text-gray-700">Login sahifasida SQL injection zaiflik aniqlandi. Bu orqali hacker login ma'lumotlarini chetlab o'tishi yoki ma'lumotlar bazasidan maxfiy ma'lumotlarni olishi mumkin.</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Zarar darajasi:</p>
                      <p className="text-gray-700">SQL injection orqali hacker ma'lumotlar bazasidagi barcha ma'lumotlarni o'qishi, o'zgartirishi yoki o'chirishi mumkin. Shuningdek, ma'lumotlar bazasini boshqarish tizimiga to'liq kirish huquqini olishi mumkin.</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Bartaraf etish yo'llari:</p>
                      <p className="text-gray-700">
                        1. Barcha foydalanuvchi kiritgan ma'lumotlarni tekshiring va tozalang.<br />
                        2. Parametrli so'rovlar (Prepared statements) yoki ORM texnologiyalaridan foydalaning.<br />
                        3. Ma'lumotlar bazasiga ulangan foydalanuvchini minimal huquqlar bilan chegaralang.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Namuna kod:</p>
                      <div className="bg-gray-50 p-3 rounded overflow-x-auto text-sm">
                        <pre className="text-gray-800 whitespace-pre-wrap">
                          {phpCodeSample1}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vulnerability 2 */}
                <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-orange-800 mr-2">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                      </span>
                      <h5 className="font-medium text-gray-900">Cross-Site Scripting (XSS) zaiflik</h5>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">O'rta</span>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Tavsif:</p>
                      <p className="text-gray-700">Izohlar qoldirishga mo'ljallangan sahifada XSS zaiflik aniqlandi. Bu orqali zararli JavaScript kodlarni saytga kiritish mumkin.</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Zarar darajasi:</p>
                      <p className="text-gray-700">XSS zaiflik orqali hacker foydalanuvchilar ma'lumotlarini o'g'irlashi, cookie ma'lumotlarini olishi yoki saytni o'zgartirishi mumkin.</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Bartaraf etish yo'llari:</p>
                      <p className="text-gray-700">
                        1. Barcha foydalanuvchi kiritgan ma'lumotlarni HTML maxsus belgilariga aylantirib (HTML escape) chiqaring.<br />
                        2. Content-Security-Policy (CSP) headerlaridan foydalaning.<br />
                        3. HttpOnly va Secure cookie flaglarini yoqing.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Namuna kod:</p>
                      <div className="bg-gray-50 p-3 rounded overflow-x-auto text-sm">
                        <pre className="text-gray-800 whitespace-pre-wrap">
                          {phpCodeSample2}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Xavfsizlik darajasi</h4>
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Umumiy xavfsizlik bahosi</span>
                    <span className="text-sm font-medium text-red-600">65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Yuqori darajali zaifliklar</span>
                      <span className="text-sm font-medium text-red-600">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">O'rta darajali zaifliklar</span>
                      <span className="text-sm font-medium text-orange-500">3</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Past darajali zaifliklar</span>
                      <span className="text-sm font-medium text-yellow-500">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Xulosa va tavsiyalar</h4>
                <p className="text-gray-700 mb-4">
                  Ushbu tekshirish natijasida web ilovangizda bir nechta xavfsizlik zaifliklar aniqlandi. Yuqori darajali zaifliklarni tezda bartaraf etish tavsiya etiladi, chunki ular ma'lumotlar bazasiga va maxfiy ma'lumotlarga xavf tug'dirmoqda. Quyidagi umumiy tavsiyalarga amal qilish orqali xavfsizlik darajasini oshirishingiz mumkin:
                </p>
                <ul className="list-disc pl-5 text-gray-700 mb-4">
                  <li className="mb-1">Barcha foydalanuvchi kiritadigan ma'lumotlarni tekshiring va tozalang</li>
                  <li className="mb-1">Dastur kodini muntazam ravishda yangilab turing</li>
                  <li className="mb-1">SSL/TLS sertifikatini o'rnating va HTTPS protokolidan foydalaning</li>
                  <li className="mb-1">Xavfsizlik headerlarini to'g'ri sozlang</li>
                  <li className="mb-1">Barcha administrator va foydalanuvchi hisoblarida kuchli parollardan foydalaning</li>
                </ul>
                <div className="flex justify-center">
                  <button className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-lg mr-4">
                    <i className="fas fa-download mr-2"></i> Hisobotni yuklab olish
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg">
                    <i className="fas fa-envelope mr-2"></i> Elektron pochtaga yuborish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 