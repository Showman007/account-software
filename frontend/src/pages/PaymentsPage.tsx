import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import PaymentsPageComp from '../components/PaymentsPage/PaymentsPageComp.tsx';

const PaymentsPage = () => {
  return (
    <ErrorBoundary>
      <PaymentsPageComp />
    </ErrorBoundary>
  );
};

export default PaymentsPage;
