import ErrorBoundary from '../../components/common/ErrorBoundary.tsx';
import LoginPageComp from '../../components/auth/LoginPageComp.tsx';

const LoginPage = () => {
  return (
    <ErrorBoundary>
      <LoginPageComp />
    </ErrorBoundary>
  );
};

export default LoginPage;
