import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import MillingPageComp from '../components/MillingPage/MillingPageComp.tsx';

const MillingPage = () => {
  return (
    <ErrorBoundary>
      <MillingPageComp />
    </ErrorBoundary>
  );
};

export default MillingPage;
