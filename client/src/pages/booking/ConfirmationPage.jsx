import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyPayment } from '../../services/paymentService';
import { useBookingStore } from '../../store/bookingStore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const navigate = useNavigate();
  const { clearBooking } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'success', 'failed', 'pending'
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (!txRef) {
      navigate('/rooms');
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyPayment(txRef);
        if (res.success && res.data) {
          const { status, reservation } = res.data;
          setStatus(status === 'success' ? 'success' : 'pending');
          setPaymentData(res.data);
          
          if (status === 'success') {
            clearBooking(); // Clear store since it's done
          }
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [txRef, navigate, clearBooking]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-16 bg-gray-50 flex flex-col items-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-500 font-medium">Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-fade-in-up">
        
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for choosing Adane International Hotel. We've sent a confirmation email with your booking details.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-8 space-y-2 border border-gray-100">
              <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Amount Paid:</span> <span className="font-semibold text-navy-900">ETB {Number(paymentData?.amount || 0).toLocaleString()}</span></p>
              <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Transaction:</span> <span className="font-mono text-gray-700">{txRef}</span></p>
            </div>

            <Link 
              to="/my-reservations"
              className="block w-full py-4 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl transition-colors shadow-lg shadow-navy-900/20"
            >
              View My Reservations
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-8">
              We couldn't verify your payment. If you were charged, please contact support with reference: <span className="font-mono font-medium">{txRef}</span>
            </p>
            <Link 
              to="/my-reservations"
              className="block w-full py-4 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl transition-colors"
            >
              Go to My Reservations
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">Payment Pending</h1>
            <p className="text-gray-600 mb-8">
              Your payment is still processing. It may take a few minutes to be confirmed.
            </p>
            <Link 
              to="/my-reservations"
              className="block w-full py-4 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl transition-colors"
            >
              Check Status Later
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
