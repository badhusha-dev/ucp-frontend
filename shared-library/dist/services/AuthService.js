export const AuthService = {
    login: async (email, password) => {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            let errMsg = 'Login failed';
            try {
                const errorData = await response.json();
                errMsg = errorData.error || errorData.message || errMsg;
            }
            catch {
                errMsg = `Login failed (${response.status} ${response.statusText})`;
            }
            throw new Error(errMsg);
        }
        const data = await response.json();
        return data.token;
    },
    register: async (email, name, password) => {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
        });
        if (!response.ok) {
            let errMsg = 'Registration failed';
            try {
                const errorData = await response.json();
                errMsg = errorData.error || errorData.message || errMsg;
            }
            catch {
                errMsg = `Registration failed (${response.status} ${response.statusText})`;
            }
            throw new Error(errMsg);
        }
        const data = await response.json();
        return data.token;
    }
};
