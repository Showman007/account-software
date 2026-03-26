import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import JournalPageComp from '../components/JournalPage/JournalPageComp.tsx';

const JournalPage = () => {
  return (
    <ErrorBoundary>
      <JournalPageComp />
    </ErrorBoundary>
  );
};

export default JournalPage;
