export default function OccupancyBar({ rate = 0 }) {
  // Ensure rate is between 0-100
  const safeRate = Math.min(Math.max(Number(rate) || 0, 0), 100);
  
  let color = 'bg-emerald-500'; // Good
  if (safeRate > 85) color = 'bg-gold-500'; // High/Full
  if (safeRate < 30) color = 'bg-red-500'; // Low

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-500">Occupancy</span>
        <span className="text-navy-900">{safeRate}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${safeRate}%` }}
        />
      </div>
    </div>
  );
}
