import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, payments, reminders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, customerId))
      .orderBy(desc(payments.paymentDate));

    const customerReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.customerId, customerId))
      .orderBy(desc(reminders.dueDate));

    return NextResponse.json({ customer, payments: customerPayments, reminders: customerReminders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);
    const body = await req.json();
    const { name, phone, totalDue, notes, isActive } = body;

    const [updated] = await db
      .update(customers)
      .set({
        name,
        phone,
        totalDue: totalDue?.toString(),
        notes,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return NextResponse.json({ customer: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    await db.delete(payments).where(eq(payments.customerId, customerId));
    await db.delete(reminders).where(eq(reminders.customerId, customerId));
    await db.delete(customers).where(eq(customers.id, customerId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
