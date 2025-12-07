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

    // Get sales for this user only
    const salesResult = await pool.request()
      .input('userId', sql.Int, parseInt(userId))
      .query(`
        SELECT
          s.id,
          s.invoiceNumber,
          s.buyerName,
          s.buyerContact,
          s.totalAmount,
          s.remarks,
          s.saleDate,
          s.createdBy,
          usr.companyName as userName
        FROM Sales s
        LEFT JOIN Users usr ON s.createdBy = usr.id
        WHERE s.createdBy = @userId
        ORDER BY s.saleDate DESC, s.id DESC
      `);

    // Get all sale items
    const itemsResult = await pool.request().query(`
      SELECT
        si.saleId,
        si.categoryId,
        si.subCategoryId,
        si.quantity,
        si.rate,
        si.totalValue
      FROM SaleItems si
    `);

    // Group sale items by saleId
    const itemsBySaleId: { [key: number]: any[] } = {};
    itemsResult.recordset.forEach((item: any) => {
      if (!itemsBySaleId[item.saleId]) {
        itemsBySaleId[item.saleId] = [];
      }
      itemsBySaleId[item.saleId].push(item);
    });

    // Attach sale items to each sale
    const salesWithItems = salesResult.recordset.map((sale: any) => ({
      ...sale,
      saleItems: itemsBySaleId[sale.id] || [],
    }));

    return NextResponse.json({ success: true, data: salesWithItems });
  } catch (error: any) {
    console.error('Sales fetch error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { buyerName, buyerContact, saleItems, totalAmount, remarks, createdBy } = await request.json();

    const pool = await connectDB();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Generate invoice number: INV-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

      // Get today's sale count to generate sequential number
      const countResult = await transaction.request().query(`
        SELECT COUNT(*) as count 
        FROM Sales 
        WHERE CAST(saleDate AS DATE) = CAST(GETDATE() AS DATE)
      `);

      const todayCount = countResult.recordset[0].count + 1;
      const invoiceNumber = `INV-${dateStr}-${todayCount.toString().padStart(4, '0')}`;

      // Insert sale
      const saleResult = await transaction.request()
        .input('invoiceNumber', sql.NVarChar, invoiceNumber)
        .input('buyerName', sql.NVarChar, buyerName)
        .input('buyerContact', sql.NVarChar, buyerContact || null)
        .input('totalAmount', sql.Decimal(10, 2), totalAmount)
        .input('remarks', sql.NVarChar, remarks || null)
        .input('createdBy', sql.Int, createdBy)
        .query(`
          INSERT INTO Sales (invoiceNumber, buyerName, buyerContact, totalAmount, remarks, createdBy, saleDate)
          OUTPUT INSERTED.*
          VALUES (@invoiceNumber, @buyerName, @buyerContact, @totalAmount, @remarks, @createdBy, GETDATE())
        `);

      const saleId = saleResult.recordset[0].id;

      // Insert sale items and update stock
      for (const item of saleItems) {
        // Insert sale item
        await transaction.request()
          .input('saleId', sql.Int, saleId)
          .input('categoryId', sql.Int, item.categoryId)
          .input('subCategoryId', sql.Int, item.subCategoryId || null)
          .input('quantity', sql.Decimal(10, 2), item.quantity)
          .input('rate', sql.Decimal(10, 2), item.rate)
          .input('totalValue', sql.Decimal(10, 2), item.totalValue)
          .query(`
            INSERT INTO SaleItems (saleId, categoryId, subCategoryId, quantity, rate, totalValue)
            VALUES (@saleId, @categoryId, @subCategoryId, @quantity, @rate, @totalValue)
          `);

        // Update stock - decrease available stock, increase outflow
        const stockUpdateQuery = item.subCategoryId
          ? `UPDATE Stock 
             SET totalOutflow = totalOutflow + @quantity,
                 availableStock = availableStock - @quantity,
                 totalValue = availableStock * averageRate
             WHERE categoryId = @categoryId 
               AND subCategoryId = @subCategoryId 
               AND userId = @userId`
          : `UPDATE Stock 
             SET totalOutflow = totalOutflow + @quantity,
                 availableStock = availableStock - @quantity,
                 totalValue = availableStock * averageRate
             WHERE categoryId = @categoryId 
               AND subCategoryId IS NULL 
               AND userId = @userId`;

        await transaction.request()
          .input('categoryId', sql.Int, item.categoryId)
          .input('subCategoryId', sql.Int, item.subCategoryId || null)
          .input('quantity', sql.Decimal(10, 2), item.quantity)
          .input('userId', sql.Int, createdBy)
          .query(stockUpdateQuery);
      }

      await transaction.commit();

      return NextResponse.json({ success: true, data: saleResult.recordset[0] }, { status: 201 });
    } catch (err) {
      await transaction.rollback();

      throw err;
    }
  } catch (error: any) {
    console.error('Sales creation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
