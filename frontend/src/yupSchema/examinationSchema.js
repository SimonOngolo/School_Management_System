import * as yup from "yup";
import dayjs from "dayjs";

export const examinationSchema = yup.object().shape({
  date: yup
    .date()
    .transform((value, originalValue) =>
      originalValue ? dayjs(originalValue).toDate() : null,
    )
    .required("Date is required")
    .nullable(),
  period: yup.string().required("Period is required"),
  classId: yup.string().required("Class is required"),
  subject: yup.string().required("Subject is required"),
  examType: yup.string().required("Exam Type is required"),
});
