import * as Yup from "yup";

export const noticeSchema = Yup.object().shape({
  title: Yup.string().required("Title Text is required"),
  message: Yup.string().required("Message body is required"),
  audience: Yup.string()
    .oneOf(["all", "students", "teachers"], "Invalid audience type")
    .required("Audience target is required"),
});
