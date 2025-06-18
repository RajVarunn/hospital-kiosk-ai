/**
 * Custom hook to access environment variables in a type-safe way
 */
export const useEnv = () => {
  return {
    AWS_REGION: process.env.AWS_REGION || 'us-west-2',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  };
};

export default useEnv;