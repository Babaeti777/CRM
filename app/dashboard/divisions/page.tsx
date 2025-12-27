'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// RSMeans/CSI MasterFormat Divisions
const RSMEANS_DIVISIONS = [
  { code: '01', name: 'General Requirements', description: 'Project management, temporary facilities, and general conditions' },
  { code: '02', name: 'Existing Conditions', description: 'Site assessment, demolition, and hazardous material remediation' },
  { code: '03', name: 'Concrete', description: 'Concrete forming, reinforcement, and placement' },
  { code: '04', name: 'Masonry', description: 'Unit masonry, stone assemblies, and masonry restoration' },
  { code: '05', name: 'Metals', description: 'Structural steel, metal joists, and metal fabrications' },
  { code: '06', name: 'Wood, Plastics & Composites', description: 'Rough carpentry, finish carpentry, and architectural woodwork' },
  { code: '07', name: 'Thermal & Moisture Protection', description: 'Waterproofing, insulation, roofing, and siding' },
  { code: '08', name: 'Openings', description: 'Doors, windows, and glazing systems' },
  { code: '09', name: 'Finishes', description: 'Plaster, drywall, tile, flooring, and painting' },
  { code: '10', name: 'Specialties', description: 'Signage, lockers, toilet accessories, and partitions' },
  { code: '11', name: 'Equipment', description: 'Commercial and industrial equipment' },
  { code: '12', name: 'Furnishings', description: 'Furniture, window treatments, and accessories' },
  { code: '13', name: 'Special Construction', description: 'Swimming pools, special purpose rooms, and structures' },
  { code: '14', name: 'Conveying Equipment', description: 'Elevators, escalators, and material handling' },
  { code: '21', name: 'Fire Suppression', description: 'Fire suppression systems and equipment' },
  { code: '22', name: 'Plumbing', description: 'Plumbing fixtures, piping, and equipment' },
  { code: '23', name: 'HVAC', description: 'Heating, ventilation, and air conditioning systems' },
  { code: '25', name: 'Integrated Automation', description: 'Building automation and control systems' },
  { code: '26', name: 'Electrical', description: 'Electrical distribution, lighting, and systems' },
  { code: '27', name: 'Communications', description: 'Voice, data, and audio-visual systems' },
  { code: '28', name: 'Electronic Safety & Security', description: 'Access control, surveillance, and fire detection' },
  { code: '31', name: 'Earthwork', description: 'Site clearing, excavation, and grading' },
  { code: '32', name: 'Exterior Improvements', description: 'Paving, fencing, landscaping, and irrigation' },
  { code: '33', name: 'Utilities', description: 'Water, sewer, gas, and electrical utilities' },
  { code: '34', name: 'Transportation', description: 'Railways, roadways, and bridges' },
  { code: '35', name: 'Waterway & Marine', description: 'Waterway and marine construction' },
  { code: '40', name: 'Process Integration', description: 'Gas and liquid handling, process integration' },
  { code: '41', name: 'Material Processing', description: 'Material storage and processing equipment' },
  { code: '42', name: 'Process Heating & Cooling', description: 'Boilers, furnaces, and process heating/cooling' },
  { code: '43', name: 'Process Gas & Liquid Handling', description: 'Gas and liquid process equipment' },
  { code: '44', name: 'Pollution Control', description: 'Air and water pollution control equipment' },
  { code: '45', name: 'Industry-Specific Manufacturing', description: 'Industry-specific manufacturing equipment' },
  { code: '46', name: 'Water & Wastewater Equipment', description: 'Water and wastewater treatment' },
  { code: '48', name: 'Electrical Power Generation', description: 'Power generation equipment and systems' },
]

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
  const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      const response = await fetch('/api/divisions')
      const data = await response.json()

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

  // Check if a division already exists
  const isDivisionCreated = (divisionName: string) => {
    return divisions.some(d => d.name.toLowerCase().includes(divisionName.toLowerCase()) ||
                          divisionName.toLowerCase().includes(d.name.toLowerCase()))
  }

  // Get full division name with code
  const getFullDivisionName = (code: string, name: string) => {
    return `Division ${code} - ${name}`
  }

  // Toggle selection
  const toggleSelection = (code: string) => {
    const newSelected = new Set(selectedDivisions)
    if (newSelected.has(code)) {
      newSelected.delete(code)
    } else {
      newSelected.add(code)
    }
    setSelectedDivisions(newSelected)
  }

  // Select all uncreated divisions
  const selectAllUncreated = () => {
    const uncreated = RSMEANS_DIVISIONS.filter(d => !isDivisionCreated(d.name))
    setSelectedDivisions(new Set(uncreated.map(d => d.code)))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedDivisions(new Set())
  }

  // Create selected divisions
  const createSelectedDivisions = async () => {
    if (selectedDivisions.size === 0) return

    setCreating(true)
    setSuccessMessage(null)
    let created = 0

    try {
      for (const code of selectedDivisions) {
        const div = RSMEANS_DIVISIONS.find(d => d.code === code)
        if (!div) continue

        const fullName = getFullDivisionName(div.code, div.name)

        try {
          const response = await fetch('/api/divisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: fullName,
              description: div.description,
            }),
          })

          if (response.ok) {
            created++
          }
        } catch (err) {
          console.error(`Failed to create division ${fullName}:`, err)
        }
      }

      setSuccessMessage(`Successfully created ${created} division(s)`)
      setSelectedDivisions(new Set())
      await fetchDivisions()
    } catch (err) {
      setError('Failed to create divisions')
    } finally {
      setCreating(false)
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
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <p className="text-sm text-red-600">
              Please check your Firebase configuration and try again.
            </p>
          </div>
        ) : (
          <>
            {/* RSMeans Division Selector */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">RSMeans/CSI MasterFormat Divisions</h2>
                    <p className="text-sm text-gray-500 mt-1">Select divisions to add to your project</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllUncreated}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Select All New
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={createSelectedDivisions}
                      disabled={selectedDivisions.size === 0 || creating}
                      className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {creating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>Add Selected ({selectedDivisions.size})</>
                      )}
                    </button>
                  </div>
                </div>

                {successMessage && (
                  <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg">
                    {successMessage}
                  </div>
                )}
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {RSMEANS_DIVISIONS.map((div) => {
                    const isCreated = isDivisionCreated(div.name)
                    const isSelected = selectedDivisions.has(div.code)

                    return (
                      <label
                        key={div.code}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isCreated
                            ? 'bg-green-50 border border-green-200'
                            : isSelected
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isCreated || isSelected}
                          disabled={isCreated}
                          onChange={() => !isCreated && toggleSelection(div.code)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500">{div.code}</span>
                            <span className="font-medium text-gray-900">{div.name}</span>
                            {isCreated && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Added
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{div.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Current Divisions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Your Divisions ({divisions.length})</h2>
              </div>

              {divisions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No divisions created yet</p>
                  <p className="text-sm mt-2">Select divisions from the list above to get started</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {divisions.map((division) => (
                      <div
                        key={division.id}
                        className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {division.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {division.description || 'No description'}
                        </p>
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className="text-gray-500">Bids:</span>
                            <span className="ml-2 font-semibold text-blue-600">{division._count.bids}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Subcontractors:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              {division._count.subcontractors}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
