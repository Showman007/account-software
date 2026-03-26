import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import ExpensesPageComp from '../components/ExpensesPage/ExpensesPageComp.tsx';

const ExpensesPage = () => {
  return (
    <ErrorBoundary>
      <ExpensesPageComp />
    </ErrorBoundary>
  );
};

export default ExpensesPage;
