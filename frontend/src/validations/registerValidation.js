export const registerValidation = (name, email, password, confirmPassword) => {
    const errors = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    };
    if (!name || name.length < 3) { errors.name = 'Name must be at least 3 characters'; }
    if (!email || !email.includes('@')) { errors.email = 'Invalid email address'; }
    if (!password || password.length < 6) { errors.password = 'Password must be at least 6 characters'; }
    if (!confirmPassword || password !== confirmPassword) { errors.confirmPassword = 'Passwords do not match'; }
    return errors;
}