import * as yup from "yup";


export const subjectSchema = yup.object({
  subject_name: yup
    .string()
    .min(2, "At least 2 characters required")
    .required("Subject Text is required"),
  subject_codename: yup.string().required("Subject Code Name is required"),
});
