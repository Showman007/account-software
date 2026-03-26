import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import ProfitCalculatorPageComp from '../components/ProfitCalculatorPage/ProfitCalculatorPageComp.tsx';

const ProfitCalculatorPage = () => {
  return (
    <ErrorBoundary>
      <ProfitCalculatorPageComp />
    </ErrorBoundary>
  );
};

export default ProfitCalculatorPage;
