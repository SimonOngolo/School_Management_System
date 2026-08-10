import * as yup from "yup";


export const classSchema = yup.object({
  class_text: yup
    .string()
    .min(2, "At least 2 characters required")
    .required("Class Text is required"),
  class_num: yup.string().required("Class number is required"),
});
