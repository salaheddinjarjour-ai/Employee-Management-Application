import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '../ui/Button'
import { Form } from '../ui/form'

interface FormWrapperProps<T extends z.ZodType> {
  schema: T
  defaultValues?: Partial<z.infer<T>>
  onSubmit: (values: z.infer<T>) => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
  submitLabel?: string
  children: (form: ReturnType<typeof useForm<z.infer<T>>>) => React.ReactNode
  className?: string
}

export function FormWrapper<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  submitLabel = "حفظ",
  children,
  className = ""
}: FormWrapperProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  })

  const handleSubmit = async (values: z.infer<T>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      toast.success("تم الحفظ بنجاح")
      onSuccess?.()
      form.reset()
    } catch (error) {
      console.error('Form submission error:', error)
      const errorMessage = error instanceof Error ? error.message : "تعذر الحفظ، حاول مرة أخرى"
      toast.error(errorMessage)
      onError?.(error instanceof Error ? error : new Error("Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-6 ${className}`}>
        {children(form)}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </div>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
