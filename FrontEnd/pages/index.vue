<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useRouter } from "vue-router";

// Define interface for API response
interface LoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

const router = useRouter();

const fields = [
  {
    name: "email",
    type: "text" as const,
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password" as const,
    placeholder: "Enter your password",
  },
];

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Must be at least 6 characters"),
});

type Schema = z.output<typeof schema>;

  async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    const response = await $fetch<LoginResponse>("http://localhost:3001/auth/login", {
      method: "POST",
      body: payload.data,
    });

    // เข้าถึง token และ user จาก response โดยตรง
    const token = response.token;
    const user = response.user;

    console.log('Login token:', token);  // ดู token ใน console

    if (token) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "STAFF") {
        router.replace("/pet");
      } else {
        router.replace("/medicalRecord");
      }
    }

  } catch (error: any) {
    alert(error?.data?.message || "Invalid email or password");
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm :schema="schema" :fields="fields" title="Login" icon="i-lucide-user" @submit="onSubmit">
        <template #description>
          Don't have an account?
          <ULink to="/auth/register" class="text-primary font-medium">Sign up</ULink>.
        </template>
        <template #password-hint>
          <ULink to="/auth/forgot-password" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
        </template>
        <template #footer>
          By signing in, you agree to our
          <ULink to="/terms" class="text-primary font-medium">Terms of Service</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>