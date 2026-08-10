import * as yup from "yup";
import dayjs from "dayjs";

export const periodSchema = yup.object().shape({
  teacher: yup.string().required("Teacher is required"),
  subject: yup.string().required("Subject is required"),
  period: yup.string().required("Period is required"),
  date: yup
    .date()
    .transform((value, originalValue) =>
      originalValue ? dayjs(originalValue).toDate() : null,
    )
    .required("Date is required")
    .nullable(),
});
