import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, gte, lte, and, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const type = searchParams.get("type");

    const conditions = [];
    if (dateFrom) conditions.push(gte(transactions.transactionDate, new Date(dateFrom)));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(transactions.transactionDate, toDate));
    }
    if (type) conditions.push(eq(transactions.type, type));

    const result = await db
      .select()
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactions.transactionDate))
      .limit(500);

    // Summary
    const summary = await db
      .select({
        type: transactions.type,
        total: sql<string>`SUM(${transactions.amount})`,
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(transactions.type);

    return NextResponse.json({ transactions: result, summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, category, description, amount, transactionDate } = body;

    if (!type || !description || !amount) {
      return NextResponse.json({ error: "Type, description and amount are required" }, { status: 400 });
    }

    const [transaction] = await db
      .insert(transactions)
      .values({
        type,
        category: category || "",
        description,
        amount: parseFloat(amount).toString(),
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      })
      .returning();

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
