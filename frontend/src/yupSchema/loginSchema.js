import * as yup from 'yup';
import axios from 'axios';

export const loginSchema = yup.object({
    
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 10 characters').required('Password is required'),

})