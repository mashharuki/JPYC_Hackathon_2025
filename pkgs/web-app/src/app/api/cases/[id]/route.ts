import { supabase } from "@/utils/supabase"
import { NextResponse } from "next/server"
import { z } from "zod"

const paramsSchema = z.object({
  id: z.string().uuid()
})

const responseCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  goal_amount: z.union([z.string(), z.number()]),
  current_amount: z.union([z.string(), z.number()]),
  wallet_address: z.string(),
  semaphore_group_id: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional()
})

const updateCaseSchema = z.object({
  currentAmount: z.string().regex(/^\d+$/)
})

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const parsedParams = paramsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Validation error", details: parsedParams.error.flatten() }, { status: 400 })
  }

  const { id } = parsedParams.data
  const { data, error } = await supabase.from("cases").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Supabase error", details: error.message }, { status: 500 })
  }

  const parsed = responseCaseSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: "Response validation error", details: parsed.error.flatten() }, { status: 500 })
  }

  return NextResponse.json(parsed.data, { status: 200 })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const parsedParams = paramsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Validation error", details: parsedParams.error.flatten() }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = updateCaseSchema.safeParse(payload)
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Validation error", details: parsedBody.error.flatten() }, { status: 400 })
  }

  const { id } = parsedParams.data
  const { currentAmount } = parsedBody.data

  const { data, error } = await supabase
    .from("cases")
    .update({ current_amount: currentAmount, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Supabase error", details: error.message }, { status: 500 })
  }

  const parsed = responseCaseSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: "Response validation error", details: parsed.error.flatten() }, { status: 500 })
  }

  return NextResponse.json(parsed.data, { status: 200 })
}
