const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, path } = event;
    const id = path.split('/').pop();

    switch (httpMethod) {
      case 'GET':
        if (path.includes('/low-stock')) {
          // Get low stock items
          const lowStockItems = await pool.query(`
            SELECT 
              name,
              category,
              quantity,
              min_quantity,
              unit,
              (min_quantity - quantity) as needed_quantity
            FROM inventory_items 
            WHERE quantity <= min_quantity
            ORDER BY (min_quantity - quantity) DESC
          `);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: lowStockItems.rows })
          };
        } else if (id && !isNaN(id)) {
          // Get inventory item by ID
          const result = await pool.query(`
            SELECT 
              i.*,
              (i.quantity <= i.min_quantity) as is_low_stock,
              COUNT(t.id) as transaction_count
            FROM inventory_items i
            LEFT JOIN inventory_transactions t ON i.id = t.item_id
            WHERE i.id = $1
            GROUP BY i.id
          `, [id]);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows[0] || null })
          };
        } else {
          // Get all inventory items
          const { category, lowStock } = event.queryStringParameters || {};
          
          let query = `
            SELECT 
              i.*,
              (i.quantity <= i.min_quantity) as is_low_stock,
              COUNT(t.id) as transaction_count
            FROM inventory_items i
            LEFT JOIN inventory_transactions t ON i.id = t.item_id
          `;
          
          const params = [];
          let whereConditions = [];
          let paramCount = 1;

          if (category) {
            whereConditions.push(`i.category = $${paramCount}`);
            params.push(category);
            paramCount++;
          }

          if (lowStock === 'true') {
            whereConditions.push('i.quantity <= i.min_quantity');
          }

          if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
          }

          query += ` GROUP BY i.id ORDER BY i.name`;

          const result = await pool.query(query, params);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result.rows })
          };
        }

      case 'POST':
        if (path.includes('/use')) {
          // Use inventory item
          const { itemId, quantityUsed, notes } = JSON.parse(event.body);
          
          // Get current item
          const itemResult = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [itemId]);
          
          if (itemResult.rows.length === 0) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
          }

          const item = itemResult.rows[0];
          
          if (item.quantity < quantityUsed) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Insufficient quantity' }) };
          }

          // Update quantity
          const newQuantity = item.quantity - quantityUsed;
          await pool.query('UPDATE inventory_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newQuantity, itemId]);

          // Record transaction
          await pool.query(
            `INSERT INTO inventory_transactions 
             (item_id, transaction_type, quantity, unit_cost, total_cost, notes) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [itemId, 'USAGE', quantityUsed, item.unit_cost, quantityUsed * (item.unit_cost || 0), notes || 'Item usage']
          );

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: { 
                remainingQuantity: newQuantity,
                message: 'Item used successfully'
              }
            })
          };
        } else {
          // Add new inventory item
          const { name, category, quantity, unit, minQuantity, unitCost, supplier, expirationDate, location, notes } = JSON.parse(event.body);
          
          const result = await pool.query(
            `INSERT INTO inventory_items 
             (name, category, quantity, unit, min_quantity, unit_cost, supplier, expiration_date, location, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [name, category, quantity, unit, minQuantity, unitCost, supplier, expirationDate, location, notes]
          );

          // Record initial transaction
          await pool.query(
            `INSERT INTO inventory_transactions 
             (item_id, transaction_type, quantity, unit_cost, total_cost, notes) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [result.rows[0].id, 'PURCHASE', quantity, unitCost, quantity * (unitCost || 0), 'Initial stock']
          );

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ data: result.rows[0] })
          };
        }

      case 'PUT':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        const updateData = JSON.parse(event.body);
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        const fieldMap = {
          name: 'name',
          category: 'category',
          quantity: 'quantity',
          unit: 'unit',
          minQuantity: 'min_quantity',
          unitCost: 'unit_cost',
          supplier: 'supplier',
          expirationDate: 'expiration_date',
          location: 'location',
          notes: 'notes'
        };

        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined && fieldMap[key]) {
            updateFields.push(`${fieldMap[key]} = $${paramCount}`);
            updateValues.push(updateData[key]);
            paramCount++;
          }
        });

        if (updateFields.length === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid fields to update' }) };
        }

        updateValues.push(id);
        const updateQuery = `UPDATE inventory_items SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: updateResult.rows[0] })
        };

      case 'DELETE':
        if (!id || isNaN(id)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid ID' }) };
        }

        // Delete transactions first
        await pool.query('DELETE FROM inventory_transactions WHERE item_id = $1', [id]);
        const deleteResult = await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);
        
        if (deleteResult.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Item deleted successfully' })
        };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Inventory API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};