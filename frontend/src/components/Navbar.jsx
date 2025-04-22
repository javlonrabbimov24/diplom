import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  // Joriy sahifani aniqlash uchun funksiya
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-800 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-bold text-blue-800">CyberShield</span>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link 
                to="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/') ? 'border-blue-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} text-sm font-medium`}
              >
                Asosiy
              </Link>
              <Link 
                to="/dashboard" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard') ? 'border-blue-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} text-sm font-medium`}
              >
                Boshqaruv paneli
              </Link>
              <Link 
                to="/threats" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/threats') ? 'border-blue-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} text-sm font-medium`}
              >
                Xavflar
              </Link>
              <Link 
                to="/settings" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/settings') ? 'border-blue-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} text-sm font-medium`}
              >
                Sozlamalar
              </Link>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-800 hover:text-blue-900">
              Kirish
            </Link>
            <Link to="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900">
              Ro'yxatdan o'tish
            </Link>
          </div>
          <div className="flex items-center md:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/') ? 'border-blue-800 text-blue-800 bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} text-base font-medium`}
            >
              Asosiy
            </Link>
            <Link 
              to="/dashboard" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/dashboard') ? 'border-blue-800 text-blue-800 bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} text-base font-medium`}
            >
              Boshqaruv paneli
            </Link>
            <Link 
              to="/threats" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/threats') ? 'border-blue-800 text-blue-800 bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} text-base font-medium`}
            >
              Xavflar
            </Link>
            <Link 
              to="/settings" 
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/settings') ? 'border-blue-800 text-blue-800 bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} text-base font-medium`}
            >
              Sozlamalar
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 space-x-3">
              <Link to="/login" className="block text-base font-medium text-blue-800 hover:text-blue-900">
                Kirish
              </Link>
              <Link to="/register" className="block px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900">
                Ro'yxatdan o'tish
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar 