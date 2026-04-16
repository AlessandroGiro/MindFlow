import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Login } from './components/Login';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { TeamMember } from './types/index';
import * as server from './services/server';
import { Loader } from './components/Loader';

const AuthGate: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                // Using getInitialData as it's more efficient than separate calls in the mock setup
                const data = await server.getInitialData();
                setTeam(data.team);
            } catch (error) {
                console.error("Failed to load team data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeam();
    }, []);
    
    const handleLogin = (user: TeamMember) => {
        setCurrentUser(user);
    };

    const handleAddUserAndLogin = async (userData: { name: string; email: string }) => {
        const newUser = await server.addNewUser(userData);
        // Add to local state to avoid re-fetch for the session
        setTeam(prevTeam => [...prevTeam, newUser]);
        setCurrentUser(newUser);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-base-100">
                <Loader />
            </div>
        );
    }

    if (!currentUser) {
        return <Login team={team} onLogin={handleLogin} onAddUser={handleAddUserAndLogin} />;
    }

    return <App currentUser={currentUser} onLogout={handleLogout} />;
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to. Ensure an element with id='root' exists in your HTML.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);