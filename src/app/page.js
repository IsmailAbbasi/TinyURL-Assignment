'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    target_url: '',
    code: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/links?search=${encodeURIComponent(search)}`
        : '/api/links';
      
      const res = await fetch(url);
      
      // ✅ Check if response is OK
      if (!res.ok) {
        console.error('Failed to fetch links:', res.status);
        setLinks([]);
        return;
      }
      
      const data = await res.json();
      
      // ✅ Ensure data is an array
      if (Array.isArray(data)) {
        setLinks(data);
      } else {
        console.error('Invalid response format:', data);
        setLinks([]);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLinks(searchQuery);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: formData.target_url,
          code: formData.code || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create link');
        return;
      }

      setSuccessMessage(`Link created successfully! Code: ${data.code}`);
      setFormData({ target_url: '', code: '' });
      setShowForm(false);
      fetchLinks();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setFormError('Failed to create link');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Are you sure you want to delete link: ${code}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/links/${code}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchLinks(searchQuery);
        setSuccessMessage('Link deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to delete link');
      }
    } catch (error) {
      alert('Error deleting link');
    }
  };

  const copyToClipboard = (code) => {
    const fullUrl = `${window.location.origin}/${code}`;
    
    navigator.clipboard.writeText(fullUrl).then(() => {
      setSuccessMessage(`Link copied: ${fullUrl}`);
      setTimeout(() => setSuccessMessage(''), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    });
  };

  const visitLink = (code) => {
    window.open(`/${code}`, '_blank');
  };

  const truncateUrl = (url, maxLength = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  // ✅ FIXED: Properly convert to IST
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      
      // Convert to IST (UTC+5:30)
      const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      
      const istDate = date.toLocaleString('en-IN', options);
      return `${istDate} IST`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">TinyLink</h1>
            <a 
              href="/api/healthz" 
              target="_blank"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Health Check
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {showForm ? 'Cancel' : '+ Add New Link'}
          </button>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code or URL..."
              className="flex-1 sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchLinks();
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Add Link Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Short Link</h2>
            
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="https://example.com/your-long-url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={formLoading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the full URL you want to shorten
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Code (optional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="mycode (6-8 alphanumeric characters)"
                  pattern="[A-Za-z0-9]{6,8}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={formLoading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty for auto-generated code. Must be 6-8 characters (letters and numbers only)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Creating...' : 'Create Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError('');
                    setFormData({ target_url: '', code: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                  disabled={formLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Links Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading links...
            </div>
          ) : links.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No links found matching your search.' : 'No links yet. Create your first short link!'}
              </p>
              {!showForm && !searchQuery && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  + Add New Link
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Short Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Clicks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Clicked
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-blue-600">
                            {link.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(link.code)}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                            title="Copy full link"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => visitLink(link.code)}
                            className="text-green-500 hover:text-green-700 text-lg"
                            title="Visit link (counts as click)"
                          >
                            🔗
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={link.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-900 hover:text-blue-600"
                          title={link.target_url}
                        >
                          {truncateUrl(link.target_url)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {link.total_clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(link.last_clicked)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/code/${link.code}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Stats
                          </Link>
                          <button
                            onClick={() => handleDelete(link.code)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            TinyLink - URL Shortener © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
