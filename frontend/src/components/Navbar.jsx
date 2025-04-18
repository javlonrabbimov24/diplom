import { Link } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <i className="fas fa-shield-alt text-2xl text-blue-800 mr-2"></i>
                <span className="text-xl font-bold text-blue-800">CyberShield</span>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-blue-800 text-sm font-medium text-gray-900">
                Asosiy
              </Link>
              <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Boshqaruv paneli
              </Link>
              <Link to="/threats" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Xavflar
              </Link>
              <Link to="/settings" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
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
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className="block pl-3 pr-4 py-2 border-l-4 border-blue-800 text-base font-medium text-blue-800 bg-blue-50">
              Asosiy
            </Link>
            <Link to="/dashboard" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
              Boshqaruv paneli
            </Link>
            <Link to="/threats" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
              Xavflar
            </Link>
            <Link to="/settings" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
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