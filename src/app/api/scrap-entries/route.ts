import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        se.id,
        se.entryType,
        se.categoryId,
        se.subCategoryId,
        se.departmentId,
        se.machineId,
        se.quantity,
        se.unit,
        se.rate,
        se.totalValue,
        se.jobNumber,
        se.remarks,
        se.createdBy,
        se.createdAt,
        c.name as categoryName,
        sc.name as subCategoryName,
        d.name as departmentName,
        m.name as machineName,
        usr.companyName as userName
      FROM ScrapEntries se
      LEFT JOIN Categories c ON se.categoryId = c.id
      LEFT JOIN SubCategories sc ON se.subCategoryId = sc.id
      LEFT JOIN Departments d ON se.departmentId = d.id
      LEFT JOIN Machines m ON se.machineId = m.id
      LEFT JOIN Users usr ON se.createdBy = usr.id
      ORDER BY se.createdAt DESC
    `);
    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      entryType, categoryId, subCategoryId, departmentId, machineId,
      quantity, unit, rate, totalValue, jobNumber, remarks, createdBy
    } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('entryType', sql.NVarChar, entryType)
      .input('categoryId', sql.Int, categoryId)
      .input('subCategoryId', sql.Int, subCategoryId || null)
      .input('departmentId', sql.Int, departmentId)
      .input('machineId', sql.Int, machineId || null)
      .input('quantity', sql.Decimal(10, 2), quantity)
      .input('unit', sql.NVarChar, unit)
      .input('rate', sql.Decimal(10, 2), rate)
      .input('totalValue', sql.Decimal(10, 2), totalValue)
      .input('jobNumber', sql.NVarChar, jobNumber || null)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('createdBy', sql.Int, createdBy)
      .query(`
        INSERT INTO ScrapEntries (entryType, categoryId, subCategoryId, departmentId, machineId, quantity, unit, rate, totalValue, jobNumber, remarks, createdBy)
        OUTPUT INSERTED.*
        VALUES (@entryType, @categoryId, @subCategoryId, @departmentId, @machineId, @quantity, @unit, @rate, @totalValue, @jobNumber, @remarks, @createdBy)
      `);
    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
