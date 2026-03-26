import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import PartiesPageComp from '../components/PartiesPage/PartiesPageComp.tsx';

const PartiesPage = () => {
  return (
    <ErrorBoundary>
      <PartiesPageComp />
    </ErrorBoundary>
  );
};

export default PartiesPage;
