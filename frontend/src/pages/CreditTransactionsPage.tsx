import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import CreditTransactionsPageComp from '../components/CreditTransactionsPage/CreditTransactionsPageComp.tsx';

const CreditTransactionsPage = () => {
  return (
    <ErrorBoundary>
      <CreditTransactionsPageComp />
    </ErrorBoundary>
  );
};

export default CreditTransactionsPage;
