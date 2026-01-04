import { NextResponse } from "next/server"
import { z } from "zod"
import { supabase } from "@/utils/supabase"

const createCaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  goalAmount: z.string().regex(/^\d+$/),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  semaphoreGroupId: z.string().min(1)
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

const responseCasesSchema = z.array(responseCaseSchema)

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = createCaseSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, goalAmount, walletAddress, semaphoreGroupId } = parsed.data

  const { data, error } = await supabase
    .from("cases")
    .insert({
      title,
      description,
      goal_amount: goalAmount,
      wallet_address: walletAddress,
      semaphore_group_id: semaphoreGroupId
    })
    .select("id, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: "Supabase error", details: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 })
}

export async function GET() {
  const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Supabase error", details: error.message }, { status: 500 })
  }

  const parsed = responseCasesSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: "Response validation error", details: parsed.error.flatten() }, { status: 500 })
  }

  return NextResponse.json({ cases: parsed.data }, { status: 200 })
}
