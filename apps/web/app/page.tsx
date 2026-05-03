import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 text-center space-y-6 max-w-lg">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]">
          C
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Collaborative Team Hub</h1>
        <p className="text-slate-400 text-lg">
          Manage shared goals, post announcements, and track action items in real time with your team.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="px-6 py-3 bg-slate-800 text-slate-100 rounded-lg font-medium hover:bg-slate-700 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}