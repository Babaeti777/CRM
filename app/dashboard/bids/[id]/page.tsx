'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'

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
  documents: Array<{
    id: string
    fileName: string
    fileSize: number
    uploadedAt: string
  }>
  responses: Array<{
    id: string
    status: string
    amount: number | null
    notes: string | null
    submittedAt: string | null
    subcontractor: {
      id: string
      name: string
      email: string
      company: string
    }
  }>
}

interface UserInfo {
  id: string
  email: string
  name: string | null
  hasValidToken: boolean
  accessToken: string | null
}

interface AISuggestion {
  division: string
  confidence: number
  reasoning: string
}

export default function BidDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: bidId } = use(params)
  const router = useRouter()
  const [bid, setBid] = useState<Bid | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifying, setNotifying] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)

  const fetchBid = useCallback(async () => {
    try {
      const response = await fetch(`/api/bids/${bidId}`)
      if (response.ok) {
        const data = await response.json()
        setBid(data)
      }
    } catch (error) {
      console.error('Error fetching bid:', error)
    } finally {
      setLoading(false)
    }
  }, [bidId])

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }, [])

  useEffect(() => {
    fetchBid()
    fetchUser()
  }, [fetchBid, fetchUser])

  useEffect(() => {
    if (bid?.aiSuggestedDivision) {
      try {
        setAiSuggestion(JSON.parse(bid.aiSuggestedDivision))
      } catch (e) {
        console.error('Error parsing AI suggestion:', e)
      }
    }
  }, [bid])

  const confirmDivision = async () => {
    try {
      await fetch(`/api/bids/${bidId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          divisionConfirmed: true,
          status: 'ACTIVE',
        }),
      })
      fetchBid()
    } catch (error) {
      console.error('Error confirming division:', error)
    }
  }

  const notifySubcontractors = async () => {
    if (!user) {
      alert('Please sign in to send notifications')
      return
    }

    setNotifying(true)
    try {
      const response = await fetch(`/api/bids/${bidId}/notify-subcontractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Please review the bid opportunity: ${bid?.title}`,
          createEvent: true,
        }),
      })

      if (response.ok) {
        alert('Subcontractors notified successfully!')
        fetchBid()
      } else {
        const errorData = await response.json()
        if (errorData.error?.includes('access token')) {
          alert('Your Microsoft session has expired. Please sign in again.')
        } else {
          alert(errorData.error || 'Failed to notify subcontractors')
        }
      }
    } catch (error) {
      console.error('Error notifying subcontractors:', error)
      alert('Failed to notify subcontractors')
    } finally {
      setNotifying(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-gray-200 text-gray-800',
      VIEWED: 'bg-blue-200 text-blue-800',
      INTERESTED: 'bg-yellow-200 text-yellow-800',
      QUOTED: 'bg-green-200 text-green-800',
      DECLINED: 'bg-red-200 text-red-800',
      ACCEPTED: 'bg-purple-200 text-purple-800',
    }
    return colors[status] || 'bg-gray-200 text-gray-800'
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!bid) {
    return <div className="flex justify-center items-center min-h-screen">Bid not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{bid.title}</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Division Suggestion */}
        {aiSuggestion && !bid.divisionConfirmed && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              🤖 AI Division Suggestion
            </h3>
            <p className="text-yellow-800 mb-2">
              <strong>Suggested Division:</strong> {aiSuggestion.division}
            </p>
            <p className="text-yellow-800 mb-2">
              <strong>Confidence:</strong> {(aiSuggestion.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-yellow-800 mb-4">
              <strong>Reasoning:</strong> {aiSuggestion.reasoning}
            </p>
            <button
              onClick={confirmDivision}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Confirm Division
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bid Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Bid Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 mt-1">{bid.description || 'No description'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Division:</span>
                  <span className="ml-2 text-gray-900">{bid.division.name}</span>
                  {bid.divisionConfirmed ? (
                    <span className="ml-2 text-green-600 text-sm">✓ Confirmed</span>
                  ) : (
                    <span className="ml-2 text-yellow-600 text-sm">⚠ Pending</span>
                  )}
                </div>
                {bid.dueDate && (
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(bid.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 px-3 py-1 rounded-full text-sm bg-blue-200 text-blue-800">
                    {bid.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Documents ({bid.documents.length})</h2>
              {bid.documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {bid.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {(doc.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subcontractor Responses */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Subcontractor Responses ({bid.responses.length})
                </h2>
                {bid.divisionConfirmed && (
                  <button
                    onClick={notifySubcontractors}
                    disabled={notifying}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {notifying ? 'Notifying...' : 'Notify Subcontractors'}
                  </button>
                )}
              </div>

              {bid.responses.length === 0 ? (
                <p className="text-gray-500">No responses yet</p>
              ) : (
                <div className="space-y-3">
                  {bid.responses.map((response) => (
                    <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{response.subcontractor.name}</h3>
                          <p className="text-sm text-gray-600">{response.subcontractor.company}</p>
                          <p className="text-sm text-gray-600">{response.subcontractor.email}</p>
                          {response.amount && (
                            <p className="mt-2 text-lg font-semibold text-green-600">
                              ${response.amount.toLocaleString()}
                            </p>
                          )}
                          {response.notes && (
                            <p className="mt-2 text-sm text-gray-700">{response.notes}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(response.status)}`}>
                            {response.status}
                          </span>
                          {response.submittedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(response.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Responses:</span>
                  <span className="font-semibold">{bid.responses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quoted:</span>
                  <span className="font-semibold">
                    {bid.responses.filter((r) => r.status === 'QUOTED').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Declined:</span>
                  <span className="font-semibold">
                    {bid.responses.filter((r) => r.status === 'DECLINED').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold">
                    {bid.responses.filter((r) => r.status === 'PENDING').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
