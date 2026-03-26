import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import QueryRunnerPageComp from '../components/QueryRunnerPage/QueryRunnerPageComp.tsx';

const QueryRunnerPage = () => {
  return (
    <ErrorBoundary>
      <QueryRunnerPageComp />
    </ErrorBoundary>
  );
};

export default QueryRunnerPage;
