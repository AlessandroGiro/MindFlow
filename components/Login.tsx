
import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types/index';

interface LoginProps {
    team: TeamMember[];
    onLogin: (user: TeamMember) => void;
    onAddUser: (userData: { name: string, email: string }) => Promise<void>;
}

export const Login: React.FC<LoginProps> = ({ team, onLogin, onAddUser }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [showNewUserForm, setShowNewUserForm] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (team.length > 0 && !selectedUserId) {
            setSelectedUserId(team[0].email);
        }
    }, [team, selectedUserId]);

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedUser = team.find(member => member.email === selectedUserId);
        if (selectedUser) {
            onLogin(selectedUser);
        } else if (team.length > 0) {
            // Fallback if selection is somehow invalid
            onLogin(team[0]);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName.trim() || !newUserEmail.trim()) {
            alert("Please provide a name and email.");
            return;
        }
        setIsCreating(true);
        try {
            await onAddUser({ name: newUserName.trim(), email: newUserEmail.trim() });
            // onAddUser in the parent component will handle the actual login
        } catch (error) {
            console.error("Failed to create user:", error);
            alert("There was an error creating the user.");
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="flex justify-center items-center gap-3 mb-8">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 text-brand-primary">
                        <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M12 2.5C5.8 2.5 3.5 6.2 4.6 12c1.1 5.8 6.4 9.5 7.4 9.5s6.3-3.7 7.4-9.5c1.1-5.8-1.2-9.5-7.4-9.5zM12 7c-3.2 0-4.3 1.6-3.7 5.1.6 3.5 3.7 5.9 3.7 5.9s3.1-2.4 3.7-5.9c.6-3.5-.5-5.1-3.7-5.1z" />
                    </svg>
                    <h1 className="text-4xl font-bold">MindFlow</h1>
                </div>

                <div className="bg-base-200 p-8 rounded-2xl shadow-2xl">
                    {!showNewUserForm ? (
                        <form onSubmit={handleSignIn}>
                            <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back!</h2>
                            <p className="text-base-content-secondary mb-6 text-center">Select your profile to continue.</p>
                            
                            <div className="mb-6">
                                <label htmlFor="userSelect" className="block text-sm font-bold mb-2 text-base-content-secondary">Select User</label>
                                <select 
                                    id="userSelect" 
                                    value={selectedUserId} 
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200"
                                    required
                                    disabled={team.length === 0}
                                >
                                    {team.length > 0 ? (
                                        team.map(member => (
                                            <option key={member.email} value={member.email}>{member.name}</option>
                                        ))
                                    ) : (
                                        <option>No users found</option>
                                    )}
                                </select>
                            </div>
                            
                            <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors duration-300 disabled:opacity-50" disabled={team.length === 0}>
                                Sign In
                            </button>

                            <div className="text-center mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewUserForm(true)}
                                    className="text-sm font-medium text-brand-primary hover:underline"
                                >
                                    Or create a new user
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCreateUser}>
                             <h2 className="text-2xl font-bold mb-2 text-center">Create New User</h2>
                             <p className="text-base-content-secondary mb-6 text-center">Enter your details to get started.</p>

                             <div className="mb-4">
                                <label htmlFor="newUserName" className="block text-sm font-bold mb-2 text-base-content-secondary">Full Name</label>
                                <input type="text" id="newUserName" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" placeholder="e.g., Alex Doe" required />
                            </div>
                             <div className="mb-6">
                                <label htmlFor="newUserEmail" className="block text-sm font-bold mb-2 text-base-content-secondary">Email</label>
                                <input type="email" id="newUserEmail" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" placeholder="e.g., alex.doe@example.com" required />
                            </div>

                             <button type="submit" disabled={isCreating} className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors duration-300 disabled:opacity-50">
                                {isCreating ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Create & Sign In'}
                            </button>

                            <div className="text-center mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewUserForm(false)}
                                    className="text-sm font-medium text-brand-primary hover:underline"
                                >
                                    Back to sign in
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};