import { useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { fetchUsers } from '../api/client';
import { UserContext } from './useUser';

const USER_STORAGE_KEY = 'vyro-user-id';

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const data = await fetchUsers();
        if (ignore) return;
        setUsers(data);

        const savedId = localStorage.getItem(USER_STORAGE_KEY);
        let matchedUser = data.find((u) => u.id.toString() === savedId);

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
        if (!ignore) {
          setIsLoadingUsers(false);
        }
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  const switchUser = (userId: number) => {
    const selected = users.find((u) => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
      localStorage.setItem(USER_STORAGE_KEY, selected.id.toString());
    }
  };

  const refreshUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to refresh users:', err);
    } finally {
      setIsLoadingUsers(false);
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
        refreshUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
