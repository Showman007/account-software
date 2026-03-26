import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import ImportExportPageComp from '../components/ImportExportPage/ImportExportPageComp.tsx';

const ImportExportPage = () => {
  return (
    <ErrorBoundary>
      <ImportExportPageComp />
    </ErrorBoundary>
  );
};

export default ImportExportPage;
