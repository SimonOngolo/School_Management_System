import * as yup from "yup";

export const studentSchema = yup.object({
  name: yup
    .string()
    .min(2, "Name must contain at least 2 characters")
    .required("Name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  groupe: yup.string().required("Field is required"),
  date_naissance: yup.string().required("Date of birth is required"),
  lieu_naissance: yup.string().required("Place of birth is required"),
  bac: yup.string().required("Baccalaureate is required"),
  ecole_origine: yup.string().required("Origin school is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});
