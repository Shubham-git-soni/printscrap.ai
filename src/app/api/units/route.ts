import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Units ORDER BY name');
    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, symbol, createdBy } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('symbol', sql.NVarChar, symbol)
      .input('createdBy', sql.Int, createdBy || 1)
      .query('INSERT INTO Units (name, symbol, createdBy) OUTPUT INSERTED.* VALUES (@name, @symbol, @createdBy)');
    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pool = await connectDB();
    await pool.request().input('id', sql.Int, parseInt(id!)).query('DELETE FROM Units WHERE id = @id');
    await pool.close();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
