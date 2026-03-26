import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import InboundPageComp from '../components/InboundPage/InboundPageComp.tsx';

const InboundPage = () => {
  return (
    <ErrorBoundary>
      <InboundPageComp />
    </ErrorBoundary>
  );
};

export default InboundPage;
