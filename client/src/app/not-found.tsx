import Link from 'next/link'

// Disable prerendering for this page to avoid client-side library issues
export const dynamic = 'force-dynamic'
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-[#FFE81E] border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-12">
            <span className="text-4xl">🤔</span>
          </div>
          <h1 className="text-6xl font-black text-black mb-4">404</h1>
          <h2 className="text-3xl font-bold text-black mb-2 uppercase">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8">
            Oops! Looks like this page decided to castle to a different location.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block px-8 py-3 bg-[#FFE81E] text-black font-bold text-lg uppercase border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500 mt-4">
            <Link href="/dashboard" className="hover:text-black font-medium">Dashboard</Link>
            {" | "}
            <Link href="/dashboard/chess" className="hover:text-black font-medium">Chess</Link>
          </div>
        </div>
      </div>
    </div>
  )
}