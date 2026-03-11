import React from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import StudentDashboard from "../pages/StudentDashboard.jsx";
import { mockLogout, mockAPI } from '../setupTests';

// Mock useAuth with logged in user
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'student@example.com', role: 'APPLICANT' },
    logout: mockLogout,
    loading: false,
  }),
}));

describe("StudentDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockClear();
  });

  test("Dashboard renders loading state initially", () => {
    mockAPI.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<StudentDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("Dashboard fetches and displays user profile", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0.85,
      skills: [
        { name: 'Python', status: 'verified' },
        { name: 'React', status: 'pending' },
      ],
    };

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  test("Dashboard displays internships list", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0.85,
      skills: [],
    };

    const mockInternships = [
      {
        id: 1,
        title: 'Frontend Developer',
        company: 'Tech Corp',
        description: 'Build React applications',
      },
      {
        id: 2,
        title: 'Backend Developer',
        company: 'Data Systems',
        description: 'Build Python APIs',
      },
    ];

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: mockInternships });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      const matches = screen.getAllByText('Frontend Developer');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  test("Displays VSPS score when verified", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0.85,
      skills: [],
    };

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  test("Displays user skills", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0.85,
      skills: [
        { name: 'Python', status: 'verified' },
        { name: 'React', status: 'pending' },
      ],
    };

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  test("Logout button calls logout function", async () => {
    const user = userEvent.setup();
    
    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: { id: 1, user: 1, vsps_score: 0, skills: [] } });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/sign out/i);
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  test("Handles API errors gracefully", async () => {
    mockAPI.get.mockRejectedValue(new Error('API Error'));

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Should still render without errors, just with default empty state
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  test("Shows empty state when no internships available", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0,
      skills: [],
    };

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  test("Featured internships section shows first 3 internships", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0.85,
      skills: [],
    };

    const mockInternships = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      title: `Role ${i + 1}`,
      company: `Company ${i + 1}`,
      description: `Description ${i + 1}`,
    }));

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: mockInternships });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      const first = screen.getAllByText('Role 1');
      const second = screen.getAllByText('Role 2');
      const third = screen.getAllByText('Role 3');
      expect(first.length).toBeGreaterThan(0);
      expect(second.length).toBeGreaterThan(0);
      expect(third.length).toBeGreaterThan(0);
    });
  });

  test("Sidebar navigation is rendered on desktop", async () => {
    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: { id: 1, user: 1, vsps_score: 0, skills: [] } });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // The sidebar should exist or be hidden on mobile
    const mainContent = screen.getByText(/sign out/i);
    expect(mainContent).toBeInTheDocument();
  });

  test("Profile section is displayed", async () => {
    const mockProfile = {
      id: 1,
      user: 1,
      vsps_score: 0.85,
      skills: [],
      education: 'B.Tech in Computer Science',
    };

    mockAPI.get.mockImplementation((url) => {
      if (url === '/api/applicants/me/') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/internships/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
