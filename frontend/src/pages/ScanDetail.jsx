import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const ScanDetail = () => {
  const { id } = useParams();
  const [scanData, setScanData] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVulnerability, setExpandedVulnerability] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchScanDetails = async () => {
      try {
        setLoading(true);
        const data = await scan.getScanById(id);
        setScanData(data);
        
        // Fetch vulnerabilities if scan is completed
        if (data.status === 'completed') {
          const vulnData = await scan.getVulnerabilities(id);
          setVulnerabilities(vulnData);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load scan details. Please try again later.');
        console.error('Error fetching scan details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScanDetails();
  }, [id]);

  const toggleVulnerabilityDetails = (vulnId) => {
    if (expandedVulnerability === vulnId) {
      setExpandedVulnerability(null);
    } else {
      setExpandedVulnerability(vulnId);
    }
  };

  const handleDownloadReport = async () => {
    try {
      await scan.generateReport(id);
    } catch (err) {
      console.error('Error downloading report:', err);
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
      critical: { class: 'bg-red-100 text-red-800', text: 'Critical' },
      high: { class: 'bg-orange-100 text-orange-800', text: 'High' },
      medium: { class: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      low: { class: 'bg-blue-100 text-blue-800', text: 'Low' },
      info: { class: 'bg-gray-100 text-gray-800', text: 'Info' }
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
      completed: { class: 'bg-green-100 text-green-800', text: 'Completed', icon: <CheckCircle size={16} className="mr-1" /> },
      in_progress: { class: 'bg-blue-100 text-blue-800', text: 'In Progress', icon: <Clock size={16} className="mr-1" /> },
      queued: { class: 'bg-yellow-100 text-yellow-800', text: 'Queued', icon: <Clock size={16} className="mr-1" /> },
      failed: { class: 'bg-red-100 text-red-800', text: 'Failed', icon: <XCircle size={16} className="mr-1" /> },
      cancelled: { class: 'bg-gray-100 text-gray-800', text: 'Cancelled', icon: <XCircle size={16} className="mr-1" /> }
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found! </strong>
          <span className="block sm:inline">The requested scan could not be found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link to="/scan-history" className="text-blue-600 hover:text-blue-800 mr-4 flex items-center">
          <ArrowLeft size={18} className="mr-1" /> Back to Scan History
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold mb-2 md:mb-0">Scan Details</h1>
            {scanData.status === 'completed' && (
              <button 
                onClick={handleDownloadReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download size={18} className="mr-2" /> Download Report
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 flex-1">
              <div className="text-sm text-blue-600 mb-1">Target URL</div>
              <div className="flex items-center text-lg font-medium">
                <Globe size={18} className="mr-2 text-blue-600" /> 
                <a href={scanData.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline truncate">
                  {scanData.targetUrl}
                </a>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 flex-1">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="flex items-center">
                {getStatusBadge(scanData.status)}
              </div>
            </div>
            
            {scanData.status === 'completed' && scanData.securityScore !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4 flex-1">
                <div className="text-sm text-gray-600 mb-1">Security Score</div>
                {getSecurityScoreBadge(scanData.securityScore)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Start Time</div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-600" />
                <span>{scanData.createdAt ? format(new Date(scanData.createdAt), 'MMM d, yyyy HH:mm:ss') : 'N/A'}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Completion Time</div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-600" />
                <span>{scanData.completedAt ? format(new Date(scanData.completedAt), 'MMM d, yyyy HH:mm:ss') : 'N/A'}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Duration</div>
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
                    'N/A'
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
                Overview
              </button>
              <button
                onClick={() => setActiveTab('vulnerabilities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vulnerabilities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vulnerabilities {vulnerabilities.length > 0 && `(${vulnerabilities.length})`}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Scan Summary</h2>
              
              {scanData.status === 'completed' ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-red-700 mb-1">
                        {vulnerabilities.filter(v => ['critical', 'high'].includes(v.severity.toLowerCase())).length}
                      </div>
                      <div className="text-sm text-red-600">Critical/High Issues</div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-yellow-700 mb-1">
                        {vulnerabilities.filter(v => v.severity.toLowerCase() === 'medium').length}
                      </div>
                      <div className="text-sm text-yellow-600">Medium Issues</div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-blue-700 mb-1">
                        {vulnerabilities.filter(v => ['low', 'info'].includes(v.severity.toLowerCase())).length}
                      </div>
                      <div className="text-sm text-blue-600">Low/Info Issues</div>
                    </div>
                  </div>
                  
                  {scanData.summary && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="font-medium mb-2">Executive Summary</h3>
                      <p className="text-gray-700">{scanData.summary}</p>
                    </div>
                  )}
                  
                  {scanData.recommendations && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="list-disc pl-5 text-gray-700">
                        {scanData.recommendations.map((rec, index) => (
                          <li key={index} className="mb-1">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Scan is {scanData.status}</h3>
                  <p className="text-gray-600 mb-4">
                    {scanData.status === 'in_progress' && "The scan is currently running. Please check back later for results."}
                    {scanData.status === 'queued' && "The scan is queued and will start soon. Please check back later."}
                    {scanData.status === 'failed' && "The scan encountered an error and could not complete."}
                    {scanData.status === 'cancelled' && "The scan was cancelled."}
                  </p>
                  {(scanData.status === 'failed' || scanData.status === 'cancelled') && (
                    <Link to="/new-scan" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Start New Scan
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Vulnerabilities</h2>
              
              {scanData.status !== 'completed' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No vulnerability data available</h3>
                  <p className="text-gray-600">
                    Vulnerability information will be available once the scan is completed.
                  </p>
                </div>
              ) : vulnerabilities.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No vulnerabilities found</h3>
                  <p className="text-gray-600">
                    Great news! No security vulnerabilities were detected during this scan.
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
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="info">Info</option>
                    </select>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border rounded-lg px-4 py-2"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="fixed">Fixed</option>
                      <option value="false_positive">False Positive</option>
                      <option value="accepted_risk">Accepted Risk</option>
                    </select>
                  </div>
                  
                  {filteredVulnerabilities.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No matching vulnerabilities</h3>
                      <p className="text-gray-600 mb-4">
                        No vulnerabilities match your current filters.
                      </p>
                      <button
                        onClick={() => {
                          setSeverityFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Clear filters
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
                              <div className="font-medium">{vuln.title}</div>
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
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                                <p className="text-gray-700">{vuln.description}</p>
                              </div>
                              
                              {vuln.location && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                                  <p className="text-gray-700 font-mono text-sm bg-gray-50 p-2 rounded">{vuln.location}</p>
                                </div>
                              )}
                              
                              {vuln.impact && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Impact</h4>
                                  <p className="text-gray-700">{vuln.impact}</p>
                                </div>
                              )}
                              
                              {vuln.remediation && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">Remediation</h4>
                                  <p className="text-gray-700">{vuln.remediation}</p>
                                </div>
                              )}
                              
                              {vuln.cvss && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">CVSS Score</h4>
                                  <p className="text-gray-700">{vuln.cvss}</p>
                                </div>
                              )}
                              
                              {vuln.references && vuln.references.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-1">References</h4>
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