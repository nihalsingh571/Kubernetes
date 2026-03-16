import '@testing-library/jest-dom';

// Mock API service first
const mockAPI = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('./services/api', () => mockAPI);

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react')
  const motionProxy = new Proxy(
    {},
    {
      get: (_, element = 'div') => {
        // console.log('motion element', element)
        return React.forwardRef(({ children, ...props }, ref) =>
          React.createElement(element, { ...props, ref }, children),
        )
      },
    },
  )
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  }
})

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, ...props }) => React.createElement('a', props, children),
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }) => children,
  };
});

// Mock AuthContext
const mockLogin = jest.fn();
const mockSignup = jest.fn();
const mockLogout = jest.fn();
const mockVerifyLoginOtp = jest.fn();
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
    logout: mockLogout,
    verifyLoginOtp: mockVerifyLoginOtp,
    startTwoFactorSetup: jest.fn(),
    confirmTwoFactorSetup: jest.fn(),
    disableTwoFactor: jest.fn(),
    refreshUser: jest.fn(),
    user: null,
    loading: false,
  }),
}));

export { mockAPI, mockLogin, mockSignup, mockLogout, mockVerifyLoginOtp, mockNavigate };
