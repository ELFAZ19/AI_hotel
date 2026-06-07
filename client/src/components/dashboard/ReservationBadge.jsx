export default function ReservationBadge({ status }) {
  const styles = {
    pending:     'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed:   'bg-blue-100 text-blue-800 border-blue-200',
    checked_in:  'bg-green-100 text-green-800 border-green-200',
    checked_out: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled:   'bg-red-100 text-red-800 border-red-200',
    no_show:     'bg-purple-100 text-purple-800 border-purple-200',
  };

  const labels = {
    pending:     'Pending',
    confirmed:   'Confirmed',
    checked_in:  'Checked In',
    checked_out: 'Checked Out',
    cancelled:   'Cancelled',
    no_show:     'No Show',
  };

  const currentStyle = styles[status] || styles.pending;
  const currentLabel = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {currentLabel}
    </span>
  );
}
