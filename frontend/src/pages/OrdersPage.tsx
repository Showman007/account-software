import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import OrdersPageComp from '../components/OrdersPage/OrdersPageComp.tsx';

const OrdersPage = () => {
  return (
    <ErrorBoundary>
      <OrdersPageComp />
    </ErrorBoundary>
  );
};

export default OrdersPage;
