import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          CRM Bid Tracking System
        </h1>
        <p className="text-center text-lg mb-8">
          Comprehensive bid tracking with AI-powered division selection and Microsoft integration
        </p>

        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/api/auth/microsoft"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Sign in with Microsoft
          </Link>

          <Link
            href="/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📄 Document Upload</h3>
            <p className="text-gray-600">
              Upload bid documents and let AI suggest the appropriate division
            </p>
          </div>

          <div className="p-6 border border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🤖 AI Division Selection</h3>
            <p className="text-gray-600">
              Automatic division suggestions with user confirmation
            </p>
          </div>

          <div className="p-6 border border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">👥 Subcontractor Management</h3>
            <p className="text-gray-600">
              Track and manage subcontractor responses efficiently
            </p>
          </div>

          <div className="p-6 border border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📧 Outlook Integration</h3>
            <p className="text-gray-600">
              Send emails and track communications directly
            </p>
          </div>

          <div className="p-6 border border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📅 Calendar Sync</h3>
            <p className="text-gray-600">
              Automatic calendar events for bid deadlines
            </p>
          </div>

          <div className="p-6 border border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📊 Response Tracking</h3>
            <p className="text-gray-600">
              Monitor all subcontractor responses in real-time
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
