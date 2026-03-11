import React from 'react';
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";

// Mock the AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: jest.fn(),
    user: null,
    loading: false,
  }),
}));

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(component);
};

test("Login component can be imported", () => {
  expect(Login).toBeDefined();
  expect(typeof Login).toBe('function');
});

test("Login page renders correctly", () => {
  renderWithRouter(<Login />);

  // Check if main elements are present
  expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
});

test("Login form has required fields", () => {
  renderWithRouter(<Login />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  expect(emailInput).toBeRequired();
  expect(passwordInput).toBeRequired();
});

test("Signup link is present", () => {
  renderWithRouter(<Login />);

  const signupLink = screen.getByText(/sign up/i);
  expect(signupLink).toBeInTheDocument();
  expect(signupLink.closest('a')).toHaveAttribute('to', '/signup');
});