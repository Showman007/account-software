import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import DashboardPageComp from '../components/DashboardPage/DashboardPageComp.tsx';

const DashboardPage = () => {
  return (
    <ErrorBoundary>
      <DashboardPageComp />
    </ErrorBoundary>
  );
};

export default DashboardPage;
