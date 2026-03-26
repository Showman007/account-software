import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import MasterLedgerPageComp from '../components/MasterLedgerPage/MasterLedgerPageComp.tsx';

const MasterLedgerPage = () => {
  return (
    <ErrorBoundary>
      <MasterLedgerPageComp />
    </ErrorBoundary>
  );
};

export default MasterLedgerPage;
