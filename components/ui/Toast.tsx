'use client'

export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] bg-[#0D0D0D] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-toast pointer-events-none">
      {message}
    </div>
  )
}
