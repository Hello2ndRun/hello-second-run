export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] gap-6">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#111113] rounded-full animate-spin"></div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400">{text}</p>
    </div>
  );
}
