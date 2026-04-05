import { AppDialogModal, AppDialogVariant } from "@/components/common/AppDialogModal";
import React, { useCallback, useMemo, useRef, useState } from "react";

export type AppDialogExtras = {
  primaryLabel?: string;
  /** Chạy trước khi đóng modal */
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  primaryDestructive?: boolean;
};

type DialogState = {
  visible: boolean;
  title: string;
  message: string;
  variant: AppDialogVariant;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryDestructive?: boolean;
};

/**
 * Dialog tùy chỉnh (AppDialogModal) — dùng thay `Alert.alert` cho lỗi / cảnh báo / thông báo chặn luồng.
 * Render `{dialog}` một lần trong tree (thường cuối màn hình).
 */
export function useAppDialog() {
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: "",
    message: "",
    variant: "info",
  });
  const onPrimaryRef = useRef<(() => void) | undefined>();
  const onSecondaryRef = useRef<(() => void) | undefined>();

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
    onPrimaryRef.current = undefined;
    onSecondaryRef.current = undefined;
  }, []);

  const open = useCallback(
    (
      variant: AppDialogVariant,
      title: string,
      message: string,
      extras?: AppDialogExtras
    ) => {
      onPrimaryRef.current = extras?.onPrimaryPress;
      onSecondaryRef.current = extras?.onSecondaryPress;
      setState({
        visible: true,
        title,
        message,
        variant,
        primaryLabel: extras?.primaryLabel,
        secondaryLabel: extras?.secondaryLabel,
        primaryDestructive: extras?.primaryDestructive,
      });
    },
    []
  );

  const showError = useCallback(
    (title: string, message: string, extras?: AppDialogExtras) =>
      open("error", title, message, extras),
    [open]
  );

  const showWarning = useCallback(
    (title: string, message: string, extras?: AppDialogExtras) =>
      open("warning", title, message, extras),
    [open]
  );

  const showInfo = useCallback(
    (title: string, message: string, extras?: AppDialogExtras) =>
      open("info", title, message, extras),
    [open]
  );

  const hasPrimaryCallback = !!onPrimaryRef.current;

  const dialog = useMemo(
    () =>
      React.createElement(AppDialogModal, {
        visible: state.visible,
        onRequestClose: hide,
        title: state.title,
        message: state.message,
        variant: state.variant,
        primaryLabel: state.primaryLabel,
        primaryDestructive: state.primaryDestructive,
        secondaryLabel: state.secondaryLabel,
        onSecondaryPress: state.secondaryLabel
          ? () => {
              onSecondaryRef.current?.();
              hide();
            }
          : undefined,
        onPrimaryPress: hasPrimaryCallback
          ? () => {
              onPrimaryRef.current?.();
              hide();
            }
          : undefined,
      }),
    [
      state.visible,
      state.title,
      state.message,
      state.variant,
      state.primaryLabel,
      state.secondaryLabel,
      state.primaryDestructive,
      hide,
      hasPrimaryCallback,
    ]
  );

  return {
    dialog,
    showError,
    showWarning,
    showInfo,
    open,
    hide,
  };
}
