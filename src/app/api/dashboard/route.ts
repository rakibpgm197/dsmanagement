import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, payments, transactions, invoices } from "@/db/schema";
import { sql, gte, and, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Total customers
    const [custCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers);

    // Total due
    const [totalDue] = await db
      .select({ total: sql<string>`SUM(total_due)` })
      .from(customers);

    // Total payments received
    const [totalPaid] = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(payments);

    // Today's income
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [todayIncome] = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "income"),
          gte(transactions.transactionDate, todayStart)
        )
      );

    // Today's expense
    const [todayExpense] = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "expense"),
          gte(transactions.transactionDate, todayStart)
        )
      );

    // This month income
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [monthIncome] = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "income"),
          gte(transactions.transactionDate, monthStart)
        )
      );

    // This month expense
    const [monthExpense] = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "expense"),
          gte(transactions.transactionDate, monthStart)
        )
      );

    // Pending invoices count
    const [pendingInv] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(eq(invoices.status, "unpaid"));

    // Recent payments (last 5)
    const recentPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        note: payments.note,
        paymentDate: payments.paymentDate,
        customerName: customers.name,
      })
      .from(payments)
      .leftJoin(customers, eq(payments.customerId, customers.id))
      .orderBy(sql`${payments.paymentDate} DESC`)
      .limit(5);

    // Top debtors
    const topDebtors = await db
      .select()
      .from(customers)
      .orderBy(sql`total_due DESC`)
      .limit(5);

    // Last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const [inc] = await db
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "income"),
            gte(transactions.transactionDate, d),
            sql`${transactions.transactionDate} <= ${dEnd}`
          )
        );

      const [exp] = await db
        .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "expense"),
            gte(transactions.transactionDate, d),
            sql`${transactions.transactionDate} <= ${dEnd}`
          )
        );

      chartData.push({
        date: d.toLocaleDateString("bn-BD", { month: "short", day: "numeric" }),
        income: parseFloat(inc?.total || "0"),
        expense: parseFloat(exp?.total || "0"),
      });
    }

    return NextResponse.json({
      totalCustomers: Number(custCount.count),
      totalDue: parseFloat(totalDue.total || "0"),
      totalPaid: parseFloat(totalPaid.total || "0"),
      todayIncome: parseFloat(todayIncome.total || "0"),
      todayExpense: parseFloat(todayExpense.total || "0"),
      monthIncome: parseFloat(monthIncome.total || "0"),
      monthExpense: parseFloat(monthExpense.total || "0"),
      pendingInvoices: Number(pendingInv.count),
      recentPayments,
      topDebtors,
      chartData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
