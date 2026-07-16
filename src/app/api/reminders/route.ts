import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders, customers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        id: reminders.id,
        customerId: reminders.customerId,
        title: reminders.title,
        description: reminders.description,
        dueDate: reminders.dueDate,
        isCompleted: reminders.isCompleted,
        createdAt: reminders.createdAt,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(reminders)
      .leftJoin(customers, eq(reminders.customerId, customers.id))
      .orderBy(desc(reminders.dueDate));

    return NextResponse.json({ reminders: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, title, description, dueDate } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 });
    }

    const [reminder] = await db
      .insert(reminders)
      .values({
        customerId: customerId ? parseInt(customerId) : null,
        title,
        description: description || "",
        dueDate: new Date(dueDate),
      })
      .returning();

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
