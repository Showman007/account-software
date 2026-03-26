import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import UnitsPageComp from '../components/UnitsPage/UnitsPageComp.tsx';

const UnitsPage = () => {
  return (
    <ErrorBoundary>
      <UnitsPageComp />
    </ErrorBoundary>
  );
};

export default UnitsPage;
