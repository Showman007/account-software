import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import PaymentModesPageComp from '../components/PaymentModesPage/PaymentModesPageComp.tsx';

const PaymentModesPage = () => {
  return (
    <ErrorBoundary>
      <PaymentModesPageComp />
    </ErrorBoundary>
  );
};

export default PaymentModesPage;
