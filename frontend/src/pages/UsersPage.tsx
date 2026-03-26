import ErrorBoundary from '../components/common/ErrorBoundary.tsx';
import UsersPageComp from '../components/UsersPage/UsersPageComp.tsx';

const UsersPage = () => {
  return (
    <ErrorBoundary>
      <UsersPageComp />
    </ErrorBoundary>
  );
};

export default UsersPage;
