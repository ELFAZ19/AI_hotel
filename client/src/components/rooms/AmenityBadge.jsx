export default function AmenityBadge({ amenity }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-800 border border-gold-200/50">
      {amenity}
    </span>
  );
}
