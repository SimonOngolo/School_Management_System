import * as yup from "yup";

export const teacherSchema = yup.object({
  name: yup
    .string()
    .min(2, "Name must contain at least 2 characters")
    .required("Name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  age: yup.string().required("Age is required"), 
    gender: yup.string().required("Gender is required"),
  qualification: yup.string().required("Qualification is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});
