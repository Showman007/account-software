import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import PartyLedgerPageComp from '../components/PartyLedgerPage/PartyLedgerPageComp.tsx';

const PartyLedgerPage = () => {
  return (
    <ErrorBoundary>
      <PartyLedgerPageComp />
    </ErrorBoundary>
  );
};

export default PartyLedgerPage;
