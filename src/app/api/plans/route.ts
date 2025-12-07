import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Plans ORDER BY price');


    // Parse features JSON string and ensure all fields are present
    const plans = result.recordset.map((plan: any) => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      billingCycle: plan.billingCycle || 'month'
    }));

    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, price, features } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('features', sql.NVarChar, features)
      .query(`
        INSERT INTO Plans (name, price, features)
        OUTPUT INSERTED.*
        VALUES (@name, @price, @features)
      `);

    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, price, features } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('features', sql.NVarChar, features)
      .query(`
        UPDATE Plans
        SET name = @name, price = @price, features = @features
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    return NextResponse.json({ success: true, data: result.recordset[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pool = await connectDB();
    await pool.request().input('id', sql.Int, parseInt(id!)).query('DELETE FROM Plans WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
