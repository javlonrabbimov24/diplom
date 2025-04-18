import { useState, useEffect } from 'react';
import ThreatItem from '../components/ThreatItem';

const Threats = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulated data - in a real app, you would fetch from an API
    const mockThreats = [
      {
        id: 1,
        name: 'Suspicious Login Attempt',
        description: 'Multiple failed login attempts detected from IP 192.168.1.105',
        severity: 'high',
        detectedAt: '2023-06-15T08:30:00Z',
      },
      {
        id: 2,
        name: 'Outdated Software',
        description: 'Your operating system requires critical security updates',
        severity: 'medium',
        detectedAt: '2023-06-14T14:23:00Z',
      },
      {
        id: 3,
        name: 'Unusual Network Activity',
        description: 'Unusual outbound traffic detected to unknown IP addresses',
        severity: 'high',
        detectedAt: '2023-06-14T11:15:00Z',
      },
      {
        id: 4,
        name: 'Weak Password',
        description: 'User account "admin" is using a weak password',
        severity: 'medium',
        detectedAt: '2023-06-13T19:45:00Z',
      },
      {
        id: 5,
        name: 'Unencrypted Connection',
        description: 'Your device is connecting to an unencrypted WiFi network',
        severity: 'low',
        detectedAt: '2023-06-12T09:10:00Z',
      }
    ];
    
    setTimeout(() => {
      setThreats(mockThreats);
      setLoading(false);
    }, 500);
  }, []);

  const filteredThreats = filter === 'all' 
    ? threats 
    : threats.filter(threat => threat.severity === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Security Threats</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('high')} 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filter === 'high' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
          >
            High
          </button>
          <button 
            onClick={() => setFilter('medium')} 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}
          >
            Medium
          </button>
          <button 
            onClick={() => setFilter('low')} 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filter === 'low' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
          >
            Low
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredThreats.length > 0 ? (
        <div>
          {filteredThreats.map(threat => (
            <ThreatItem key={threat.id} threat={threat} />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800">No threats found</h3>
          <p className="text-gray-600 mt-2">
            {filter === 'all' 
              ? 'Your system is currently secure. No security threats have been detected.' 
              : `No ${filter} severity threats have been detected.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Threats; 