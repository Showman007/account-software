import ErrorBoundary from '../../components/common/ErrorBoundary.tsx';
import RegisterPageComp from '../../components/auth/RegisterPageComp.tsx';

const RegisterPage = () => {
  return (
    <ErrorBoundary>
      <RegisterPageComp />
    </ErrorBoundary>
  );
};

export default RegisterPage;
