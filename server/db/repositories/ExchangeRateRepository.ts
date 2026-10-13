import { query, queryOne, getConnection, sql } from '../connection'
import { ExchangeRate, CreateExchangeRate, UpdateExchangeRate } from '../types'

export class ExchangeRateRepository {
  private tableName = 'exchange_rates'

  async findById(id: number): Promise<ExchangeRate | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = @id`
    return await queryOne(sql, { id })
  }

  async findAll(filters?: Record<string, any>, limit?: number, offset?: number): Promise<ExchangeRate[]> {
    let sql = `SELECT * FROM ${this.tableName}`
    const params: any = {}

    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map(key => {
        params[key] = filters[key]
        return `${key} = @${key}`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ' ORDER BY created_at DESC'

    if (limit) {
      if (offset !== undefined) {
        sql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
        params.offset = offset
        params.limit = limit
      } else {
        sql = sql.replace('SELECT *', `SELECT TOP (@limit) *`)
        params.limit = limit
      }
    }

    const result = await query(sql, params)
    return result.recordset
  }

  async create(data: CreateExchangeRate): Promise<ExchangeRate> {
    const fields = Object.keys(data)
    const params: any = { ...data }
    
    // MSSQL bit handling is automatic for boolean in JS with mssql driver usually
    
    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${fields.map(f => `@${f}`).join(', ')});
      SELECT SCOPE_IDENTITY() AS id;
    `

    const result = await query(sql, params)
    const id = result.recordset[0].id
    
    const created = await this.findById(id)
    if (!created) throw new Error('Failed to retrieve created exchange rate')
    return created
  }

  async update(data: UpdateExchangeRate): Promise<ExchangeRate | null> {
    const { id, ...updateData } = data as any
    const fields = Object.keys(updateData)
    
    if (fields.length === 0) {
      return this.findById(id)
    }

    const setClause = fields.map(field => `${field} = @${field}`).join(', ')
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = GETDATE() 
      WHERE id = @id
    `

    await query(sql, { ...updateData, id })
    return this.findById(id)
  }

  async remove(id: number): Promise<number> {
    const success = await this.delete(id)
    return success ? 1 : 0
  }

  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = @id`
    const result = await query(sql, { id })
    return result.rowsAffected[0] > 0
  }

  /**
   * Get the currently active exchange rate
   */
  async getActiveRate(): Promise<ExchangeRate | null> {
    const sql = `
      SELECT TOP 1 * FROM ${this.tableName}
      WHERE is_active = 1
      ORDER BY effective_from DESC 
    `
    return await queryOne(sql)
  }

  /**
   * Set a new active rate (deactivates the current one)
   */
  async setActiveRate(rateData: CreateExchangeRate): Promise<ExchangeRate> {
    const pool = await getConnection()
    const transaction = new sql.Transaction(pool)
    
    try {
      await transaction.begin()
      
      // Deactivate current active rate
      const deactivateReq = new sql.Request(transaction)
      await deactivateReq.query(`UPDATE ${this.tableName} SET is_active = 0 WHERE is_active = 1`)
      
      // Create new active rate
      const insertReq = new sql.Request(transaction)
      const data = { ...rateData, is_active: true }
      const fields = Object.keys(data)
      
      fields.forEach(f => insertReq.input(f, (data as any)[f]))
      
      const insertResult = await insertReq.query(`
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${fields.map(f => `@${f}`).join(', ')});
        SELECT SCOPE_IDENTITY() AS id;
      `)
      
      const newId = insertResult.recordset[0].id
      
      await transaction.commit()
      
      const created = await this.findById(newId)
      if (!created) throw new Error('Failed to retrieve created exchange rate')
      return created

    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }

  /**
   * Get rate history
   */
  async getHistory(limit: number = 50): Promise<ExchangeRate[]> {
    const sql = `
      SELECT TOP (@limit) * FROM ${this.tableName}
      ORDER BY effective_from DESC, created_at DESC 
    `
    const result = await query(sql, { limit })
    return result.recordset
  }

  /**
   * Get rate for a specific date
   */
  async getRateForDate(date: string): Promise<ExchangeRate | null> {
    const sql = `
      SELECT TOP 1 * FROM ${this.tableName}
      WHERE effective_from <= @date 
      AND (effective_to IS NULL OR effective_to >= @date)
      ORDER BY effective_from DESC 
    `
    return await queryOne(sql, { date })
  }

  /**
   * Deactivate current active rate
   */
  async deactivateCurrentRate(): Promise<boolean> {
    const sql = `UPDATE ${this.tableName} SET is_active = 0 WHERE is_active = 1`
    const result = await query(sql)
    return result.rowsAffected[0] > 0
  }
}
