import { useState, useCallback } from 'react';
import { User } from '../schemas/auth';

interface Tokens {
  access: string;
  refresh: string;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((user: User, tokens: Tokens, rememberMe: boolean) => {
    setUser(user);
    // Store tokens in appropriate storage based on rememberMe
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('tokens', JSON.stringify(tokens));
    storage.setItem('user', JSON.stringify(user));
  }, []);

  return { user, login };
};

export default useAuth; 