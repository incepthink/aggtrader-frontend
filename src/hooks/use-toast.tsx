// src/hooks/use-toast.tsx

"use client";

import { useSnackbar, type VariantType } from "notistack";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

export function useToast() {
  const { enqueueSnackbar } = useSnackbar();

  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    let snackbarVariant: VariantType = "default";

    if (variant === "destructive") {
      snackbarVariant = "error";
    } else if (variant === "success") {
      snackbarVariant = "success";
    } else {
      snackbarVariant = "info";
    }

    const message = description ? `${title}: ${description}` : title;

    enqueueSnackbar(message, {
      variant: snackbarVariant,
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
    });
  };

  return { toast };
}
