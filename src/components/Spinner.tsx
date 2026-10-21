interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="h-8 w-8 rounded-full border-3 border-slate-200 border-t-navy-700 animate-spin" />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}
