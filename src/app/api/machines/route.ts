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
      .query(`
        SELECT m.id, m.departmentId, m.name, m.model, m.manufacturer,
               d.name as departmentName
        FROM Machines m
        LEFT JOIN Departments d ON m.departmentId = d.id
        WHERE d.createdBy = @userId
        ORDER BY d.name, m.name
      `);

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { departmentId, name, model, manufacturer, createdBy } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('departmentId', sql.Int, departmentId)
      .input('name', sql.NVarChar, name)
      .input('model', sql.NVarChar, model || null)
      .input('manufacturer', sql.NVarChar, manufacturer || null)
      .input('createdBy', sql.Int, createdBy || 1)
      .query('INSERT INTO Machines (departmentId, name, model, manufacturer, createdBy) OUTPUT INSERTED.* VALUES (@departmentId, @name, @model, @manufacturer, @createdBy)');

    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const { departmentId, name, model, manufacturer } = await request.json();

    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, parseInt(id!))
      .input('departmentId', sql.Int, departmentId)
      .input('name', sql.NVarChar, name)
      .input('model', sql.NVarChar, model || null)
      .input('manufacturer', sql.NVarChar, manufacturer || null)
      .query('UPDATE Machines SET departmentId = @departmentId, name = @name, model = @model, manufacturer = @manufacturer WHERE id = @id');

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
    await pool.request().input('id', sql.Int, parseInt(id!)).query('DELETE FROM Machines WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
