import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const signupSchema = yup.object().shape({
  username: yup
    .string()
    .required("Vui lòng nhập tên tài khoản")
    .min(3, "Tên tài khoản phải có ít nhất 3 ký tự"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp"),
  fullName: yup
    .string()
    .required("Vui lòng nhập họ và tên")
    .min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  email: yup
    .string()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
});

export type SignupFormData = yup.InferType<typeof signupSchema>;

export function useSignupForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
    },
    mode: "onChange",
  });

  return {
    control,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    watch,
    trigger,
  };
}




