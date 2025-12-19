'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Division {
  id: string
  name: string
  description: string | null
  _count: {
    bids: number
    subcontractors: number
  }
}

export default function Divisions() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      const response = await fetch('/api/divisions')
      const data = await response.json()

      // Check if response is an error or invalid data
      if (!response.ok || !Array.isArray(data)) {
        setError(data.error || data.message || 'Failed to load divisions')
        setDivisions([])
        return
      }

      setDivisions(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching divisions:', error)
      setError('Failed to connect to server')
      setDivisions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Divisions</h1>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-red-900 mb-2">Database Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <p className="text-sm text-red-600">
              Make sure DATABASE_URL is set in your Vercel environment variables.
            </p>
          </div>
        ) : divisions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No divisions found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {divisions.map((division) => (
              <div
                key={division.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {division.name}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {division.description || 'No description'}
                </p>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Bids:</span>
                    <span className="ml-2 font-semibold">{division._count.bids}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Subcontractors:</span>
                    <span className="ml-2 font-semibold">
                      {division._count.subcontractors}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
