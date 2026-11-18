import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { login } from "@/api/auth";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your work email.").email("That doesn't look like an email address."),
  password: z.string().min(1, "Enter your password.").min(8, "Passwords are at least 8 characters."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await login(email, password);
    navigate("/dashboard");
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-7 py-5">
        <AppLogo />
        <span className="text-[13px] text-muted-foreground">Need an account? Ask your store owner to invite you.</span>
      </header>
      <main className="flex flex-1 justify-center px-5 pt-14 pb-16">
        <form onSubmit={onSubmit} noValidate className="flex w-full max-w-[400px] flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl/[38px] font-semibold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground">Back office and point of sale for your branches.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" autoComplete="username" aria-invalid={Boolean(errors.email)} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" size="lg" className="h-11" disabled={isSubmitting}>
            Sign in
          </Button>
        </form>
      </main>
    </div>
  );
}
