# InternConnect / CareerLite - Recent Features & Uncommitted Changes

This document outlines the major architectural changes, new features, UI enhancements, and environment configurations introduced to the platform that are currently uncommitted. These updates elevate the application into a full-fledged, production-ready ATS (Applicant Tracking System) suitable for portfolio showcasing and Capstone presentations.

---

## 1. Authentication & OTP Verification
*   **Role-Based OTP Flow**: Upgraded the signup flow so that both Students and Recruiters must verify their institutional/work emails via a secure OTP. 
*   **UI Components**: Created `VerifyOtp.jsx` for seamless onboarding. 
*   **Backend Views**: Updated `backend/users/views.py` and `backend/core/models.py` to handle `university_email_otp_hash` and `work_email_otp_hash` with secure expirations.

## 2. Recruiter Verification & Admin Approvals
*   **Approval Workflow**: Newly registered recruiters are placed in a `PENDING_ADMIN_REVIEW` state. They cannot interact with students until approved.
*   **Admin Dashboard**: Completely overhauled `AdminDashboard.jsx` allowing Super Admins to review recruiter details (company, website, LinkedIn) and approve, reject, or suspend accounts.
*   **Database Models**: Added `AdminNotification` to alert the admin whenever a new recruiter registers.

## 3. Real-Time Applicant Tracking System (ATS) Pipeline
*   **Recruiter Dashboard (`RecruiterDashboard.jsx`)**: Transformed into a modern ATS. Recruiters can view all applicants in a pipeline table.
*   **Live Status Updates**: Recruiters can change application statuses (`PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`) via a dynamic dropdown. 
*   **Automated Notifications**: Changing an applicant's status triggers a real-time notification to the student's dashboard.

## 4. Recruiter ↔ Student Chat System
*   **Messaging Architecture**: Added `Conversation` and `Message` models (`backend/core/models.py`).
*   **Chat UI**: Built full-screen, professional messaging interfaces (`RecruiterChatUI.jsx` and `StudentChatUI.jsx`).
*   **Robust State Handling**: Protected frontend logic against undefined API responses to prevent UI crashes.

## 5. Interview Scheduling Integration
*   **Direct Scheduling**: Recruiters can schedule technical or HR interviews directly from the chat interface using the `InterviewScheduleModal.jsx`.
*   **Dynamic Messages**: Interviews appear in the chat as special "Call-Out" blocks (with video icons) rather than plain text.
*   **Student Interviews Tab**: Added `StudentInterviews.jsx` so students have a dedicated hub to track their upcoming meetings.

## 6. Talent Discovery & Invitations
*   **Recruiter Sourcing**: Recruiters can browse verified students with high VSPS scores and directly invite them to apply for open roles.
*   **Student Invitations Tab**: Built `StudentInvitations.jsx` allowing students to Accept or Reject direct recruiter invites.

## 7. Extended Profiles & Resume Uploads
*   **Student Resumes**: Modified `ApplicantProfile` to support PDF resume uploads. Added `MEDIA_ROOT` and `MEDIA_URL` configurations to `internconnect_backend/settings.py` and `urls.py`.
*   **Recruiter Branding**: Added comprehensive fields to `RecruiterProfile` including Industry, Company Size, Website, and Location to support realistic company listings.

## 8. Professional Demo Dataset Seeder
*   **`seed_demo_data.py`**: Created a robust Django management command that instantly wipes non-admin users and generates:
    *   10 Realistic Top-Tier Recruiters (Wipro, Google, Amazon, etc.)
    *   20 Indian Students (IIT, LPU, BITS, etc.) with hyper-realistic verified skills.
    *   25 active Internships and over 60 realistic applications, chat histories, and notifications.
*   **Usage**: `python manage.py seed_demo_data` allows you to instantly recover the perfect portfolio-ready database state anywhere.

---

## ⚙️ Environment Configurations (.env)
To support the newly added features, the following configurations were introduced or require updates in your `backend/.env` file:

```env
# Required for Email OTP Verification
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_specific_password

# Required for serving Resume / Media uploads locally
MEDIA_URL=/media/
MEDIA_ROOT=media/
```

## 📂 New Untracked Files Added
*   `backend/core/management/commands/seed_demo_data.py`
*   `backend/users/signals.py` (Handles auto-profile generation safely)
*   `src/components/InterviewScheduleModal.jsx`
*   `src/components/RecruiterChatUI.jsx`
*   `src/components/StudentChatUI.jsx`
*   `src/pages/StudentInterviews.jsx`
*   `src/pages/StudentInvitations.jsx`
*   `src/pages/StudentMessages.jsx`
*   Various Django Migrations (`0011` to `0019`)

---
**Next Steps for Git:** 
When you are ready to save this work permanently to your repository, you should run:
1. `git add .`
2. `git commit -m "feat: complete ATS pipeline, real-time chat, interview scheduling, and demo seeder"`
3. `git push origin main`
