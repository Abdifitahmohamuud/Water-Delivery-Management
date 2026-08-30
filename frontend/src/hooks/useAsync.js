import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for handling async operations with loading and error states
 * Usage: const { execute, isLoading, error, data } = useAsync(asyncFn)
 */
export const useAsync = (asyncFunction, immediate = false) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setStatus('pending');
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await asyncFunction(...args);
        setData(response);
        setStatus('success');
        return response;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Something went wrong';
        setError(errorMessage);
        setStatus('error');
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  return {
    execute,
    isLoading,
    error,
    data,
    status,
  };
};

export default useAsync;
