import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import AdminDashboard from "../pages/AdminDashboard.jsx";
import { mockLogout, mockAPI } from '../setupTests';

// Mock useAuth with admin user
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', role: 'ADMIN' },
    logout: mockLogout,
    loading: false,
  }),
}));

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockClear();
    mockAPI.get.mockClear();
    mockAPI.patch.mockClear();
  });

  test("Admin dashboard renders loading state initially", () => {
    mockAPI.get.mockImplementation(() => new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("Dashboard displays admin title", async () => {
    mockAPI.get.mockResolvedValue({ data: [] });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });

  test("Dashboard fetches and displays recruiters", async () => {
    const mockRecruiters = [
      { id: 1, company_name: 'Tech Corp', email: 'hr@techcorp.com', company_website: 'https://techcorp.com', is_verified: true },
      { id: 2, company_name: 'Data Systems', email: 'hr@datasystems.com', company_website: 'https://datasystems.com', is_verified: false },
    ];
    mockAPI.get.mockResolvedValue({ data: mockRecruiters });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Data Systems')).toBeInTheDocument();
    });
  });

  test("Shows empty state when no recruiters", async () => {
    mockAPI.get.mockResolvedValue({ data: [] });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No recruiters found.')).toBeInTheDocument();
    });
  });

  test("Logout button calls logout function", async () => {
    const user = userEvent.setup();
    mockAPI.get.mockResolvedValue({ data: [] });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/sign out/i);
    await user.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
});
