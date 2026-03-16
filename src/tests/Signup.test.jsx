import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Signup from '../pages/Signup.jsx'
import { mockSignup } from '../setupTests'

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const proceedToProfileStep = async (user, { role = 'APPLICANT' } = {}) => {
    if (role === 'RECRUITER') {
      await user.click(screen.getByRole('button', { name: /i'm a recruiter/i }))
    } else {
      await user.click(screen.getByRole('button', { name: /i'm a student/i }))
    }
    const usernameValue = role === 'RECRUITER' ? 'talentlead' : 'innovator'
    fireEvent.change(screen.getByLabelText(/choose a username/i), { target: { value: usernameValue } })
    expect(screen.getByLabelText(/choose a username/i)).toHaveValue(usernameValue)
    const emailLabel = role === 'RECRUITER' ? /work email/i : /email address/i
    const emailValue = role === 'RECRUITER' ? 'lead@company.com' : 'student@example.com'
    fireEvent.change(screen.getByLabelText(emailLabel), { target: { value: emailValue } })
    expect(screen.getByLabelText(emailLabel)).toHaveValue(emailValue)
    const nextButton = screen.getByRole('button', { name: /next step/i })
    await user.click(nextButton)
    // debug
    await screen.findByLabelText(/first name/i)
  }

  const completeStudentProfileStep = async (user) => {
    fireEvent.change(await screen.findByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/university \/ college/i), { target: { value: 'InternConnect University' } })
    fireEvent.change(screen.getByLabelText(/degree/i), { target: { value: 'B.Tech' } })
    fireEvent.change(screen.getByLabelText(/major \/ branch/i), { target: { value: 'Computer Science' } })
    fireEvent.change(screen.getByLabelText(/graduation year/i), { target: { value: '2026' } })
    fireEvent.change(screen.getByLabelText(/interested role/i), { target: { value: 'Software Developer' } })
    fireEvent.change(screen.getByLabelText(/skills/i), { target: { value: 'Python, React' } })
    const nextButton = screen.getByRole('button', { name: /next step/i })
    await user.click(nextButton)
  }

  const fillSecurityStep = async (user, { acceptTerms = true } = {}) => {
    fireEvent.change(await screen.findByLabelText(/create password/i), { target: { value: 'Password123!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } })
    if (acceptTerms) {
      await user.click(await screen.findByRole('checkbox', { name: /terms of service/i }))
    }
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
  }

  test('renders hero and default account step', () => {
    render(<Signup />)

    expect(screen.getByText(/Join the Future of Internships/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^Account$/i)[0]).toBeInTheDocument()
    expect(screen.getByLabelText(/Choose a username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
  })

  test('switching role updates account fields', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    await user.click(screen.getByRole('button', { name: /i'm a recruiter/i }))

    expect(await screen.findByLabelText(/Work Email/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/University Email/i)).not.toBeInTheDocument()
  })

  test('requires student profile info before advancing', async () => {
    const user = userEvent.setup()
    render(<Signup />)

    await proceedToProfileStep(user)
    await screen.findByLabelText(/first name/i)

    const nextButton = screen.getByRole('button', { name: /next step/i })
    await user.click(nextButton)

    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(mockSignup).not.toHaveBeenCalled()
  })

  test('completes student signup flow and calls signup', async () => {
    const user = userEvent.setup()
    mockSignup.mockResolvedValue({ success: true })

    render(<Signup />)

    await proceedToProfileStep(user)
    await completeStudentProfileStep(user)
    await fillSecurityStep(user)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'innovator',
          email: 'student@example.com',
          role: 'APPLICANT',
        }),
      )
    })
  })

  test('requires accepting terms before submission', async () => {
    const user = userEvent.setup()
    mockSignup.mockResolvedValue({ success: true })

    render(<Signup />)

    await proceedToProfileStep(user)
    await completeStudentProfileStep(user)
    await fillSecurityStep(user, { acceptTerms: false })

    expect(mockSignup).not.toHaveBeenCalled()
    expect(await screen.findByText(/Please accept the Terms/i)).toBeInTheDocument()
  })
})
