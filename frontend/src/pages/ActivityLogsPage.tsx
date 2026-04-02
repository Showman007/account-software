import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import ActivityLogsPageComp from '../components/ActivityLogsPage/ActivityLogsPageComp.tsx';

const ActivityLogsPage = () => {
  return (
    <ErrorBoundary>
      <ActivityLogsPageComp />
    </ErrorBoundary>
  );
};

export default ActivityLogsPage;
