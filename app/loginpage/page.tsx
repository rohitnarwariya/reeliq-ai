"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/Dashboard");
      }
    };

    checkSession();
  }, [router]);

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created successfully!");
  };

  const login = async () => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/Dashboard");
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        ReelIQ
      </h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        className="border p-2 mb-3 block"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="border p-2 mb-3 block"
      />

      <button
        onClick={signup}
        className="bg-green-500 text-white px-4 py-2 mr-2"
      >
        Sign Up
      </button>
      <p className="mt-4">
  Already have an account?{" "}
  <a
    href="/loginpage"
    className="text-blue-500"
  >
    Login
  </a>
</p>

      <button
        onClick={login}
        className="bg-blue-500 text-white px-4 py-2"
      >
        Login
      </button>
      <p className="mt-4">
  Don't have an account?{" "}
  <a
    href="/signuppage"
    className="text-blue-500"
  >
    Sign Up
  </a>
</p>
    </div>
  );
}