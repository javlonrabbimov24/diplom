import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scan } from '../services/api';

const Home = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setLoading(true);
    
    try {
      // Validate URL
      if (!url.trim()) {
        throw { error: "URL kiritilishi shart" };
      }
      
      // Add protocol if missing
      let scanUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        scanUrl = 'https://' + url;
      }
      
      // Start scan
      const response = await scan.startScan(scanUrl);
      const scanData = response.scan;
      
      // Polling function to check scan status
      const pollScanStatus = async (scanId) => {
        try {
          const statusResponse = await scan.getScanStatus(scanId);
          const scanStatus = statusResponse.scan;
          
          if (scanStatus.status === 'completed') {
            // Navigate to results page when completed
            navigate(`/scan-result/${scanId}`);
          } else {
            // Continue polling if not completed
            setTimeout(() => pollScanStatus(scanId), 2000);
          }
        } catch (err) {
          setError('Skanerlash holatini olishda xatolik yuz berdi');
          setLoading(false);
        }
      };
      
      // Start polling
      pollScanStatus(scanData.id);
      
    } catch (err) {
      setError(err.error || 'Skanerlashni boshlashda xatolik yuz berdi');
      setLoading(false);
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
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row justify-center gap-2">
                <input 
                  type="text" 
                  className="flex-1 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-300 focus:outline-none" 
                  placeholder="Web sayt manzilini kiriting (https://...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <button 
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-md"
                >
                  Tekshirishni boshlash
                </button>
              </form>
              <p className="text-sm text-gray-300 mt-2">Misol: https://example.uz</p>
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
                <i className="fas fa-language"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">O'zbek tilidagi interfeys</h3>
              <p className="mt-2 text-base text-gray-600">
                To'liq o'zbek tilidagi interfeys va hisobotlar bilan ishlang. Texnik ma'lumotlarni tushunarli tilda o'qing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sun'iy intellekt tahlili</h3>
              <p className="mt-2 text-base text-gray-600">
                Scan natijalarini sun'iy intellekt tahlili orqali tushunarli tilda taqdim etish imkoniyati.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Batafsil hisobotlar</h3>
              <p className="mt-2 text-base text-gray-600">
                Zaifliklar haqida batafsil ma'lumotlar va ularni bartaraf etish bo'yicha ko'rsatmalar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tezkor skanerlash</h3>
              <p className="mt-2 text-base text-gray-600">
                Tezkor va samarali skanerlash algoritmlari orqali vaqtingizni tejang.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <i className="fas fa-history"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tarixni saqlash</h3>
              <p className="mt-2 text-base text-gray-600">
                Barcha scan natijalari tarixini saqlang va xavfsizlik o'zgarishlarini kuzating.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-800 text-white mb-4">
                <i className="fas fa-cloud"></i>
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