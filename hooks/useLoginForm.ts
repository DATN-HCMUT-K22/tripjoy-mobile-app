import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const loginSchema = yup.object().shape({
  username: yup
    .string()
    .required("Vui lòng nhập tên tài khoản"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

export function useLoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onSubmit", // Chỉ validate khi submit, không validate khi đang nhập
  });

  return {
    control,
    handleSubmit,
    errors,
    isSubmitting,
  };
}
