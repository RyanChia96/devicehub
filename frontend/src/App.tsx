import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { SnackbarProvider } from "./components/Snackbar";
import { BranchProvider } from "./lib/branch-context";
import queryClient from "./lib/query-client";
import router from "./routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <SnackbarProvider>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </BranchProvider>
    </QueryClientProvider>
  );
}
