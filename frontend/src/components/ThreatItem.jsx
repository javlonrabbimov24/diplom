const ThreatItem = ({ threat }) => {
  const severityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{threat.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{threat.description}</p>
          <p className="text-gray-500 text-xs mt-2">Detected: {new Date(threat.detectedAt).toLocaleString()}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[threat.severity]}`}>
          {threat.severity.toUpperCase()}
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        <button 
          className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded hover:bg-secondary transition-colors"
        >
          Resolve
        </button>
        <button 
          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
        >
          Ignore
        </button>
      </div>
    </div>
  );
};

export default ThreatItem; 