import { FiLoader } from 'react-icons/fi';

/**
 * Button component with integrated loading state
 * Shows spinner and disables button while loading
 */
export const LoadingButton = ({
  isLoading = false,
  disabled = false,
  children,
  className = '',
  spinnerSize = 18,
  onClick,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {isLoading && <FiLoader className="animate-spin" size={spinnerSize} />}
      {children}
    </button>
  );
};

export default LoadingButton;
