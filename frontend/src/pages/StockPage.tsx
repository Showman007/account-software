import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import StockPageComp from '../components/StockPage/StockPageComp.tsx';

const StockPage = () => {
  return (
    <ErrorBoundary>
      <StockPageComp />
    </ErrorBoundary>
  );
};

export default StockPage;
