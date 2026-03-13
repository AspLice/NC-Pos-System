import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load from localeStorage on mount
    useEffect(() => {
        const savedStaff = localStorage.getItem('pos_current_staff');
        if (savedStaff) {
            try {
                setCurrentUser(JSON.parse(savedStaff));
            } catch (e) {
                console.error("Failed to parse saved staff");
            }
        }
        setLoading(false);
    }, []);

    const login = (staffMember) => {
        setCurrentUser(staffMember);
        localStorage.setItem('pos_current_staff', JSON.stringify(staffMember));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('pos_current_staff');
    };

    const value = {
        currentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
