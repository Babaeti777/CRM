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

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      const response = await fetch('/api/divisions')
      const data = await response.json()
      setDivisions(data)
    } catch (error) {
      console.error('Error fetching divisions:', error)
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
