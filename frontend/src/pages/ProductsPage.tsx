import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import ProductsPageComp from '../components/ProductsPage/ProductsPageComp.tsx';

const ProductsPage = () => {
  return (
    <ErrorBoundary>
      <ProductsPageComp />
    </ErrorBoundary>
  );
};

export default ProductsPage;
