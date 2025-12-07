import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        s.id,
        s.scrapEntryId,
        s.soldWeight,
        s.rate,
        s.totalAmount,
        s.saleDate,
        c.name as categoryName,
        usr.companyName as userName
      FROM Sales s
      LEFT JOIN ScrapEntries se ON s.scrapEntryId = se.id
      LEFT JOIN Categories c ON se.categoryId = c.id
      LEFT JOIN Users usr ON se.userId = usr.id
      ORDER BY s.saleDate DESC, s.id DESC
    `);
    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { scrapEntryId, soldWeight, rate, totalAmount, saleDate } = await request.json();
    const pool = await connectDB();

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const result = await transaction.request()
        .input('scrapEntryId', sql.Int, scrapEntryId)
        .input('soldWeight', sql.Decimal(10, 2), soldWeight)
        .input('rate', sql.Decimal(10, 2), rate)
        .input('totalAmount', sql.Decimal(10, 2), totalAmount)
        .input('saleDate', sql.DateTime, saleDate)
        .query(`
          INSERT INTO Sales (scrapEntryId, soldWeight, rate, totalAmount, saleDate)
          OUTPUT INSERTED.*
          VALUES (@scrapEntryId, @soldWeight, @rate, @totalAmount, @saleDate)
        `);

      await transaction.commit();
      await pool.close();
      return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
