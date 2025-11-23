'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StatsPage() {
  const params = useParams();
  const code = params.code;
  
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinkStats();
  }, [code]);

  const fetchLinkStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/links/${code}`);
      
      if (!res.ok) {
        setError('Link not found');
        return;
      }

      const data = await res.json();
      setLink(data);
      setError('');
    } catch (err) {
      setError('Failed to load link stats');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">TinyLink</h1>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link 
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : link ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Link Statistics
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Short Code
                  </label>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-mono text-gray-900">{link.code}</p>
                    <button
                      onClick={copyToClipboard}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Target URL
                  </label>
                  <a
                    href={link.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {link.target_url}
                  </a>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900">{formatDate(link.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Click Statistics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Total Clicks
                  </p>
                  <p className="text-4xl font-bold text-blue-600">
                    {link.total_clicks}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Last Clicked
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatDate(link.last_clicked)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}