'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Subcontractor {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  divisions: Array<{
    division: {
      id: string
      name: string
    }
  }>
}

interface ErrorDetails {
  error: string
  details?: string
  suggestion?: string
}

export default function Subcontractors() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorDetails | null>(null)

  useEffect(() => {
    fetchSubcontractors()
  }, [])

  const fetchSubcontractors = async () => {
    try {
      const response = await fetch('/api/subcontractors')
      const data = await response.json()

      // Check if response is an error or invalid data
      if (!response.ok || !Array.isArray(data)) {
        setError({
          error: data.error || 'Failed to load subcontractors',
          details: data.details,
          suggestion: data.suggestion
        })
        setSubcontractors([])
        return
      }

      setSubcontractors(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching subcontractors:', error)
      setError({
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Failed to connect to server',
        suggestion: 'Check your internet connection and try again'
      })
      setSubcontractors([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Subcontractors</h1>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
            <h2 className="text-xl font-bold text-red-900 mb-4">{error.error}</h2>

            {error.details && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left text-sm mb-4">
                <p className="font-semibold text-red-900 mb-1">Error Details:</p>
                <code className="text-red-700 break-all text-xs">{error.details}</code>
              </div>
            )}

            {error.suggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left text-sm mb-4">
                <p className="font-semibold text-blue-900 mb-1">How to Fix:</p>
                <p className="text-blue-700">{error.suggestion}</p>
              </div>
            )}

            <button
              onClick={() => { setLoading(true); fetchSubcontractors(); }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              Retry
            </button>
          </div>
        ) : subcontractors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No subcontractors found</div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Divisions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcontractors.map((subcontractor) => (
                    <tr key={subcontractor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subcontractor.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {subcontractor.company || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {subcontractor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {subcontractor.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {subcontractor.divisions.map((div) => (
                            <span
                              key={div.division.id}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {div.division.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
