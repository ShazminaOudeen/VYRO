import { createContext, useContext } from 'react';
import type { User } from '../types';

export interface UserContextValue {
    users: User[];
    currentUser: User | null;
    switchUser: (userId: number) => void;
    isLoadingUsers: boolean;
    isStaff: boolean;
    refreshUsers: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUser(): UserContextValue {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
