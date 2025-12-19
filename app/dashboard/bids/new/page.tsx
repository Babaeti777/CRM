'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Division {
  id: string
  name: string
  description: string
}

export default function NewBid() {
  const router = useRouter()
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    divisionId: '',
    dueDate: '',
  })
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      const response = await fetch('/api/divisions')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch divisions')
      }

      const data = await response.json()

      // Handle both array and error responses
      if (Array.isArray(data)) {
        setDivisions(data)
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, divisionId: data[0].id }))
        }
      } else if (data.error) {
        setError(data.message || data.error)
        setDivisions([])
      } else {
        setDivisions([])
      }
    } catch (error) {
      console.error('Error fetching divisions:', error)
      setError(error instanceof Error ? error.message : 'Failed to load divisions')
      setDivisions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (divisions.length === 0) {
      alert('Cannot create bid: No divisions available. Please set up the database first.')
      return
    }

    setUploading(true)

    try {
      // Create bid
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create bid')
      }

      const bid = await response.json()

      // Upload file if selected
      if (selectedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)

        await fetch(`/api/bids/${bid.id}/upload`, {
          method: 'POST',
          body: uploadFormData,
        })
      }

      router.push(`/dashboard/bids/${bid.id}`)
    } catch (error) {
      console.error('Error creating bid:', error)
      alert('Failed to create bid: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 border border-red-200">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Not Connected</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm mb-4">
              <p className="font-semibold text-yellow-900 mb-2">Quick Fix:</p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-800">
                <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
                <li>Add: <code className="bg-yellow-100 px-1 rounded">DATABASE_URL</code></li>
                <li>Redeploy the app</li>
              </ol>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Bid
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bid Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter bid title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={4}
              placeholder="Enter bid description"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Division *
            </label>
            {divisions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                No divisions available. Database needs to be configured.
              </div>
            ) : (
              <>
                <select
                  required
                  value={formData.divisionId}
                  onChange={(e) =>
                    setFormData({ ...formData, divisionId: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Upload a document to get AI suggestions for division
                </p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Document
            </label>
            <input
              type="file"
              onChange={(e) =>
                setSelectedFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              accept=".pdf,.doc,.docx,.txt"
            />
            <p className="mt-2 text-sm text-gray-500">
              Upload a bid document (PDF, DOC, DOCX, or TXT)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={uploading || divisions.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? 'Creating...' : 'Create Bid'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
