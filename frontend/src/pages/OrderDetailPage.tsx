import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import OrderDetailPageComp from '../components/OrderDetailPage/OrderDetailPageComp.tsx';

const OrderDetailPage = () => {
  return (
    <ErrorBoundary>
      <OrderDetailPageComp />
    </ErrorBoundary>
  );
};

export default OrderDetailPage;
