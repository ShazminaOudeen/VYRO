import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { fetchUsers } from '../api/client';

interface UserContextValue {
    users: User[];
    currentUser: User | null;
    switchUser: (userId: number) => void;
    isLoadingUsers: boolean;
    isStaff: boolean;
    refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'vyro-user-id';

export function UserProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const data = await fetchUsers();
            setUsers(data);

            const savedId = localStorage.getItem(USER_STORAGE_KEY);
            let matchedUser = data.find((u) => u.id.toString() === savedId);

            // Default to the first member if no saved user or saved user doesn't exist
            if (!matchedUser) {
                matchedUser = data.find((u) => u.role === 'MEMBER') || data[0] || null;
            }

            if (matchedUser) {
                setCurrentUser(matchedUser);
                localStorage.setItem(USER_STORAGE_KEY, matchedUser.id.toString());
            }
        } catch (err) {
            console.error('Failed to load users from backend:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const switchUser = (userId: number) => {
        const selected = users.find((u) => u.id === userId);
        if (selected) {
            setCurrentUser(selected);
            localStorage.setItem(USER_STORAGE_KEY, selected.id.toString());
        }
    };

    const isStaff = currentUser?.role === 'STAFF';

    return (
        <UserContext.Provider
            value={{
                users,
                currentUser,
                switchUser,
                isLoadingUsers,
                isStaff,
                refreshUsers: loadUsers,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
