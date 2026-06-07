export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-3 border-gold-200 border-t-gold-500 rounded-full animate-spin`}
        style={{ borderWidth: '3px' }}
      />
    </div>
  );
}
