import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const pool = await connectDB();
    const result = await pool.request()
      .input('userId', sql.Int, parseInt(userId))
      .query('SELECT * FROM Departments WHERE createdBy = @userId ORDER BY name');

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, createdBy } = await request.json();

    if (!createdBy || createdBy <= 0) {
      return NextResponse.json({ success: false, message: 'createdBy is required' }, { status: 400 });
    }

    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('createdBy', sql.Int, createdBy || 1)
      .query('INSERT INTO Departments (name, description, createdBy) OUTPUT INSERTED.* VALUES (@name, @description, @createdBy)');

    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const { name, description } = await request.json();

    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, parseInt(id!))
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .query('UPDATE Departments SET name = @name, description = @description WHERE id = @id');

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
    await pool.request().input('id', sql.Int, parseInt(id!)).query('DELETE FROM Departments WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
