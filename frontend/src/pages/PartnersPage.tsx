import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import PartnersPageComp from '../components/PartnersPage/PartnersPageComp.tsx';

const PartnersPage = () => {
  return (
    <ErrorBoundary>
      <PartnersPageComp />
    </ErrorBoundary>
  );
};

export default PartnersPage;
