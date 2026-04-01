import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import OrdersDashboardPageComp from '../components/OrdersDashboardPage/OrdersDashboardPageComp.tsx';

const OrdersDashboardPage = () => {
  return (
    <ErrorBoundary>
      <OrdersDashboardPageComp />
    </ErrorBoundary>
  );
};

export default OrdersDashboardPage;
