import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (customerId) {
      const result = await db
        .select()
        .from(payments)
        .where(eq(payments.customerId, parseInt(customerId)))
        .orderBy(desc(payments.paymentDate));
      return NextResponse.json({ payments: result });
    }

    const result = await db
      .select({
        id: payments.id,
        customerId: payments.customerId,
        amount: payments.amount,
        note: payments.note,
        paymentDate: payments.paymentDate,
        createdAt: payments.createdAt,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(payments)
      .leftJoin(customers, eq(payments.customerId, customers.id))
      .orderBy(desc(payments.paymentDate))
      .limit(100);

    return NextResponse.json({ payments: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, amount, note, paymentDate } = body;

    if (!customerId || !amount) {
      return NextResponse.json({ error: "Customer ID and amount are required" }, { status: 400 });
    }

    const payAmt = parseFloat(amount);

    // Record payment
    const [payment] = await db
      .insert(payments)
      .values({
        customerId: parseInt(customerId),
        amount: payAmt.toString(),
        note: note || "",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      })
      .returning();

    // Reduce customer's due amount
    await db
      .update(customers)
      .set({
        totalDue: sql`GREATEST(0, ${customers.totalDue} - ${payAmt})`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, parseInt(customerId)));

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
