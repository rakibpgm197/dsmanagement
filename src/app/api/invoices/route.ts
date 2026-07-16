import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, customers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = db.select().from(invoices).orderBy(desc(invoices.createdAt));

    const result = status
      ? await db.select().from(invoices).where(eq(invoices.status, status)).orderBy(desc(invoices.createdAt))
      : await query;

    return NextResponse.json({ invoices: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      total,
      paid,
      notes,
      invoiceDate,
    } = body;

    const due = parseFloat(total) - parseFloat(paid || "0");
    const status =
      due <= 0 ? "paid" : parseFloat(paid || "0") > 0 ? "partial" : "unpaid";

    // Generate invoice number
    const count = await db.select({ c: sql<number>`COUNT(*)` }).from(invoices);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Number(count[0].c) + 1).padStart(4, "0")}`;

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId: customerId ? parseInt(customerId) : null,
        customerName,
        customerPhone: customerPhone || "",
        items: JSON.stringify(items || []),
        subtotal: subtotal.toString(),
        discount: (discount || 0).toString(),
        total: total.toString(),
        paid: (paid || 0).toString(),
        due: due.toString(),
        status,
        notes: notes || "",
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      })
      .returning();

    // If there's a due and linked customer, update their due
    if (due > 0 && customerId) {
      await db
        .update(customers)
        .set({
          totalDue: sql`${customers.totalDue} + ${due}`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, parseInt(customerId)));
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
