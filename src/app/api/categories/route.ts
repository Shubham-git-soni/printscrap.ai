import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Categories ORDER BY name');

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, marketRate, unit, createdBy } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('marketRate', sql.Decimal(10, 2), marketRate)
      .input('unit', sql.NVarChar, unit)
      .input('createdBy', sql.Int, createdBy || 1)
      .query('INSERT INTO Categories (name, marketRate, unit, createdBy) OUTPUT INSERTED.* VALUES (@name, @marketRate, @unit, @createdBy)');

    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const { name, marketRate, unit } = await request.json();
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, parseInt(id!))
      .input('name', sql.NVarChar, name)
      .input('marketRate', sql.Decimal(10, 2), marketRate)
      .input('unit', sql.NVarChar, unit)
      .query('UPDATE Categories SET name = @name, marketRate = @marketRate, unit = @unit WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pool = await connectDB();
    await pool.request().input('id', sql.Int, parseInt(id!)).query('DELETE FROM Categories WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
