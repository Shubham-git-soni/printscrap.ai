import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT sc.id, sc.categoryId, sc.name, sc.size, sc.unit, sc.remarks,
             c.name as categoryName
      FROM SubCategories sc
      LEFT JOIN Categories c ON sc.categoryId = c.id
      ORDER BY c.name, sc.name
    `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { categoryId, name, size, unit, remarks, createdBy } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .input('name', sql.NVarChar, name)
      .input('size', sql.NVarChar, size || null)
      .input('unit', sql.NVarChar, unit || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('createdBy', sql.Int, createdBy || 1)
      .query(`
        INSERT INTO SubCategories (categoryId, name, size, unit, remarks, createdBy)
        OUTPUT INSERTED.*
        VALUES (@categoryId, @name, @size, @unit, @remarks, @createdBy)
      `);

    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    console.error('❌ SubCategory creation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pool = await connectDB();
    await pool.request().input('id', sql.Int, parseInt(id!)).query('DELETE FROM SubCategories WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
