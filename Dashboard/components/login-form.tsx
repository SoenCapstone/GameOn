"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSignIn } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  message,
  ...props
}: React.ComponentProps<"div"> & { message?: string }) {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!message) {
      return
    }

    toast.error("Access denied", {
      description: message,
      id: "access-denied",
    })
  }, [message])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isLoaded) {
      return
    }

    setIsSubmitting(true)

    try {
      const adminCheckResponse = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!adminCheckResponse.ok) {
        toast.error("Sign in failed", {
          description: "Unable to verify admin access. Please try again.",
        })
        return
      }

      const adminCheck = (await adminCheckResponse.json().catch(() => null)) as {
        isAdmin?: boolean
      } | null

      if (!adminCheck?.isAdmin) {
        toast.error("Access denied", {
          description: "This dashboard is restricted to admin accounts.",
        })
        return
      }

      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.replace("/")
        return
      }

      toast.error("Sign in failed", {
        description: "Additional sign-in steps are required for this account.",
      })
    } catch (unknownError) {
      const clerkError = unknownError as {
        errors?: Array<{ longMessage?: string; message?: string }>
      }
      const clerkMessage = clerkError.errors?.[0]?.longMessage ??
        clerkError.errors?.[0]?.message

      toast.error("Sign in failed", {
        description: clerkMessage ?? "Unable to complete sign in. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-3 font-medium">
              <div className="mb-2 flex size-24 items-center justify-center rounded-md">
                <Image
                  src="/icon.png"
                  alt="GameOn"
                  width={84}
                  height={84}
                />
              </div>
              <span className="sr-only">GameOn</span>
            </div>
            <h1 className="text-2xl font-bold">GameOn Admin Dashboard</h1>
            <FieldDescription>Continue using your admin account</FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email" className="sr-only">
              Email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              className="h-12 px-5 md:text-base"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password" className="sr-only">
              Password
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="h-12 px-5 pr-20 md:text-base"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-5 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} className="size-4" />
                ) : (
                  <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <Field>
            <Button
              type="submit"
              className="h-12 text-base"
              disabled={!isLoaded || isSubmitting}
            >
              {isSubmitting ? (
                <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
