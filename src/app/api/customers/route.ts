import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let query;
    if (search) {
      query = db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, `%${search}%`),
            ilike(customers.phone, `%${search}%`)
          )
        )
        .orderBy(desc(customers.updatedAt));
    } else {
      query = db
        .select()
        .from(customers)
        .orderBy(desc(customers.updatedAt));
    }

    const result = await query;
    return NextResponse.json({ customers: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, totalDue, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name,
        phone: phone || "",
        totalDue: totalDue?.toString() || "0",
        notes: notes || "",
      })
      .returning();

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
