import { query, queryOne } from '../connection'
import { Attachment, CreateAttachment } from '../types'

export class AttachmentRepository {
  private tableName = 'attachments'

  /**
   * Find a record by ID
   */
  async findById(id: number): Promise<Attachment | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = @id`
    return await queryOne(sql, { id })
  }

  /**
   * Find all records with optional filters
   */
  async findAll(filters?: Record<string, any>, limit?: number, offset?: number): Promise<Attachment[]> {
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
      // MSSQL offset/fetch
      if (offset !== undefined) {
        sql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
        params.offset = offset
        params.limit = limit
      } else {
        // Just TOP? No, standard SQL or TOP
        // If no offset, use TOP in select or just FETCH/OFFSET with 0
        sql = sql.replace('SELECT *', `SELECT TOP (@limit) *`)
        params.limit = limit
      }
    }

    const result = await query(sql, params)
    return result.recordset
  }

  /**
   * Create a new record
   */
  async create(data: CreateAttachment): Promise<Attachment> {
    const fields = Object.keys(data)
    const params: any = { ...data }
    
    // Convert boolean to 1/0 if needed, but MSSQL handles bit with 1/0 or true/false usually.
    // mssql driver handles JS types.

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${fields.map(f => `@${f}`).join(', ')});
      SELECT SCOPE_IDENTITY() AS id;
    `

    const result = await query(sql, params)
    const id = result.recordset[0].id
    
    const created = await this.findById(id)
    if (!created) throw new Error('Failed to retrieve created attachment')
    return created
  }

  async remove(id: number): Promise<number> {
    const success = await this.delete(id)
    return success ? 1 : 0
  }

  /**
   * Delete a record
   */
  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = @id`
    const result = await query(sql, { id })
    return result.rowsAffected[0] > 0
  }

  /**
   * Find attachments by entity type and ID
   */
  async findByEntity(entityType: string, entityId: number): Promise<Attachment[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE entity_type = @entityType AND entity_id = @entityId 
      ORDER BY created_at DESC
    `
    const result = await query(sql, { entityType, entityId })
    return result.recordset
  }

  /**
   * Find attachments by uploader
   */
  async findByUploader(uploaderId: number): Promise<Attachment[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE uploaded_by = @uploaderId 
      ORDER BY created_at DESC
    `
    const result = await query(sql, { uploaderId })
    return result.recordset
  }

  /**
   * Get attachment statistics by entity type
   */
  async getStatsByEntityType(): Promise<Array<{ entity_type: string; count: number; total_size: number }>> {
    const sql = `
      SELECT 
        entity_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM ${this.tableName}
      GROUP BY entity_type 
      ORDER BY count DESC
    `
    const result = await query(sql)
    return result.recordset
  }

  /**
   * Get total storage used
   */
  async getTotalStorageUsed(): Promise<number> {
    const sql = `SELECT SUM(file_size) as total FROM ${this.tableName}`
    const result = await queryOne(sql)
    return result?.total || 0
  }

  /**
   * Delete attachments by entity (when entity is deleted)
   */
  async deleteByEntity(entityType: string, entityId: number): Promise<number> {
    const sql = `DELETE FROM ${this.tableName} WHERE entity_type = @entityType AND entity_id = @entityId`
    const result = await query(sql, { entityType, entityId })
    return result.rowsAffected[0]
  }

  /**
   * Find attachments by file type
   */
  async findByMimeType(mimeType: string): Promise<Attachment[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE mime_type = @mimeType 
      ORDER BY created_at DESC
    `
    const result = await query(sql, { mimeType })
    return result.recordset
  }

  /**
   * Search attachments by filename
   */
  async searchByFileName(queryStr: string, limit: number = 50): Promise<Attachment[]> {
    const searchTerm = `%${queryStr}%`
    const sql = `
      SELECT TOP (@limit) * FROM ${this.tableName}
      WHERE file_name LIKE @searchTerm 
      ORDER BY created_at DESC 
    `
    const result = await query(sql, { searchTerm, limit })
    return result.recordset
  }
}
