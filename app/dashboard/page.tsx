'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Bid {
  id: string
  title: string
  description: string
  status: string
  dueDate: string | null
  divisionConfirmed: boolean
  aiSuggestedDivision: string | null
  division: {
    id: string
    name: string
  }
  documents: any[]
  responses: any[]
  createdAt: string
}

export default function Dashboard() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchBids()
  }, [filter])

  const fetchBids = async () => {
    try {
      const url = filter === 'all'
        ? '/api/bids'
        : `/api/bids?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      setBids(data)
    } catch (error) {
      console.error('Error fetching bids:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      PENDING_DIVISION: 'bg-yellow-200 text-yellow-800',
      ACTIVE: 'bg-blue-200 text-blue-800',
      CLOSED: 'bg-green-200 text-green-800',
      AWARDED: 'bg-purple-200 text-purple-800',
      CANCELLED: 'bg-red-200 text-red-800',
    }
    return colors[status] || 'bg-gray-200 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Bid Tracking Dashboard
            </h1>
            <div className="flex gap-4">
              <Link
                href="/dashboard/bids/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create New Bid
              </Link>
              <Link
                href="/dashboard/subcontractors"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Manage Subcontractors
              </Link>
              <Link
                href="/dashboard/divisions"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Manage Divisions
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'DRAFT', 'PENDING_DIVISION', 'ACTIVE', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All Bids' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Bids List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bids.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No bids found</p>
            <Link
              href="/dashboard/bids/new"
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Your First Bid
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/bids/${bid.id}`}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {bid.title}
                    </Link>
                    <p className="text-gray-600 mt-2">{bid.description}</p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium">Division:</span>{' '}
                        <span className="text-gray-700">{bid.division.name}</span>
                        {!bid.divisionConfirmed && bid.aiSuggestedDivision && (
                          <span className="ml-2 text-yellow-600 text-xs">
                            (Pending Confirmation)
                          </span>
                        )}
                      </div>

                      {bid.dueDate && (
                        <div>
                          <span className="font-medium">Due:</span>{' '}
                          <span className="text-gray-700">
                            {new Date(bid.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="font-medium">Documents:</span>{' '}
                        <span className="text-gray-700">{bid.documents.length}</span>
                      </div>

                      <div>
                        <span className="font-medium">Responses:</span>{' '}
                        <span className="text-gray-700">
                          {bid.responses.filter(r => r.status !== 'PENDING').length} /{' '}
                          {bid.responses.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        bid.status
                      )}`}
                    >
                      {bid.status.replace('_', ' ')}
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
