import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import ExpenseCategoriesPageComp from '../components/ExpenseCategoriesPage/ExpenseCategoriesPageComp.tsx';

const ExpenseCategoriesPage = () => {
  return (
    <ErrorBoundary>
      <ExpenseCategoriesPageComp />
    </ErrorBoundary>
  );
};

export default ExpenseCategoriesPage;
