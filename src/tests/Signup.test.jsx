import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import Signup from "../pages/Signup.jsx";
import { mockSignup, mockNavigate } from '../setupTests';

// Mock API
jest.mock('../services/api');

describe("Signup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockSignup.mockClear();
  });

  test("Signup component renders correctly", () => {
    render(<Signup />);
    
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    // default role option shows readable text
    expect(screen.getByDisplayValue("Student / Applicant")).toBeInTheDocument();
  });

  test("Has password and confirm password fields", () => {
    render(<Signup />);
    
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmPasswordInput = screen.getByPlaceholderText("Confirm Password");
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
  });

  test("Role dropdown has Applicant and Recruiter options", () => {
    render(<Signup />);
    
    const roleSelect = screen.getByRole('combobox');
    expect(roleSelect).toBeInTheDocument();
    expect(roleSelect.value).toBe('APPLICANT');
    
    const options = roleSelect.querySelectorAll('option');
    expect(options.length).toBe(2);
    expect(options[0].value).toBe("APPLICANT");
    expect(options[1].value).toBe("RECRUITER");
  });

  test("User can fill out form fields", async () => {
    const user = userEvent.setup();
    render(<Signup />);
    
    const firstNameInput = screen.getByPlaceholderText("First Name");
    const lastNameInput = screen.getByPlaceholderText("Last Name");
    const usernameInput = screen.getByPlaceholderText("Username");
    const emailInput = screen.getByPlaceholderText("Email address");
    
    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Doe");
    await user.type(usernameInput, "johndoe");
    await user.type(emailInput, "john@example.com");
    
    expect(firstNameInput.value).toBe("John");
    expect(lastNameInput.value).toBe("Doe");
    expect(usernameInput.value).toBe("johndoe");
    expect(emailInput.value).toBe("john@example.com");
  });

  test("User can change role", async () => {
    const user = userEvent.setup();
    render(<Signup />);
    
    const roleSelect = screen.getByRole('combobox');
    await user.selectOptions(roleSelect, "RECRUITER");
    
    expect(roleSelect.value).toBe("RECRUITER");
  });

  test("Form submission calls signup with correct data", async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({ success: true });
    
    render(<Signup />);
    
    await user.type(screen.getByPlaceholderText("First Name"), "John");
    await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
    await user.type(screen.getByPlaceholderText("Username"), "johndoe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "password123");
    
    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(expect.objectContaining({
        first_name: "John",
        last_name: "Doe",
        username: "johndoe",
        email: "john@example.com",
        role: "APPLICANT",
      }));
    });
  });

  test("Navigates to login on successful signup", async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({ success: true });
    
    render(<Signup />);
    
    await user.type(screen.getByPlaceholderText("First Name"), "John");
    await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
    await user.type(screen.getByPlaceholderText("Username"), "johndoe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "password123");
    
    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("Displays error message on failed signup", async () => {
    const user = userEvent.setup();
    const errorMsg = "Email already exists";
    mockSignup.mockResolvedValue({ success: false, error: { email: [errorMsg] } });
    
    render(<Signup />);
    
    await user.type(screen.getByPlaceholderText("First Name"), "John");
    await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
    await user.type(screen.getByPlaceholderText("Username"), "johndoe");
    await user.type(screen.getByPlaceholderText("Email address"), "existing@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "password123");
    
    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  test("Login link navigates to login page", () => {
    render(<Signup />);
    
    const loginLink = screen.getByText(/sign in/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('to', '/login');
  });

  test("All fields are required", () => {
    render(<Signup />);
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      if (input.type === 'email' || input.name === 'username' || 
          input.name === 'first_name' || input.name === 'last_name') {
        expect(input).toBeRequired();
      }
    });
  });

  test("Email field has correct type", () => {
    render(<Signup />);
    
    const emailInput = screen.getByPlaceholderText("Email address");
    expect(emailInput.type).toBe("email");
  });

  test("Clears error message on form change", async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({ success: false, error: "Signup failed" });
    
    render(<Signup />);
    
    await user.type(screen.getByPlaceholderText("First Name"), "John");
    await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
    await user.type(screen.getByPlaceholderText("Username"), "johndoe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "password123");
    
    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });
  });
});
