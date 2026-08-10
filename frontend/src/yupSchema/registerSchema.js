import * as yup from 'yup';
import axios from 'axios';

export const registerSchema = yup.object({
    school_name: yup.string().min(8, 'School name is required and must contain 8 characters').required('School name is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    owner_name: yup.string().min(5, 'Owner name must be at least 5 characters').required('Owner name is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirm_password: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required')






})