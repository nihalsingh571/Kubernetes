import React from 'react';
import StudentChatUI from '../components/StudentChatUI';

export default function StudentMessages() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-white mb-2">Recruiter Messages</h1>
                <p className="text-white/60 text-sm">Communicate directly with recruiters regarding your applications and interviews.</p>
            </header>
            
            <StudentChatUI />
        </div>
    );
}
