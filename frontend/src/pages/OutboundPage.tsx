import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import OutboundPageComp from '../components/OutboundPage/OutboundPageComp.tsx';

const OutboundPage = () => {
  return (
    <ErrorBoundary>
      <OutboundPageComp />
    </ErrorBoundary>
  );
};

export default OutboundPage;
