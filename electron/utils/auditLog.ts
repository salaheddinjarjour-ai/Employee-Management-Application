import { getDatabase, persistDatabase } from '../database/init'

export interface AuditLogEntry {
    action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'VIEW'
    entity_type: string
    entity_id?: number
    entity_name?: string
    user_id?: number
    user_name?: string
    description?: string
    old_values?: any
    new_values?: any
    ip_address?: string
}

/**
 * Log an action to the audit log
 */
export function logAudit(entry: AuditLogEntry): void {
    try {
        console.log('[Audit Log] Attempting to log:', entry)
        const db = getDatabase()

        const actionType = entry.action_type.replace(/'/g, "''")
        const entityType = entry.entity_type.replace(/'/g, "''")
        const entityId = entry.entity_id || 'NULL'
        const entityName = entry.entity_name ? `'${entry.entity_name.replace(/'/g, "''")}'` : 'NULL'
        const userId = entry.user_id || 'NULL'
        const userName = entry.user_name ? `'${entry.user_name.replace(/'/g, "''")}'` : 'NULL'
        const description = entry.description ? `'${entry.description.replace(/'/g, "''")}'` : 'NULL'
        const oldValues = entry.old_values ? `'${JSON.stringify(entry.old_values).replace(/'/g, "''")}'` : 'NULL'
        const newValues = entry.new_values ? `'${JSON.stringify(entry.new_values).replace(/'/g, "''")}'` : 'NULL'
        const ipAddress = entry.ip_address ? `'${entry.ip_address.replace(/'/g, "''")}'` : 'NULL'

        const sql = `
      INSERT INTO audit_logs (
        action_type, entity_type, entity_id, entity_name,
        user_id, user_name, description,
        old_values, new_values, ip_address, created_at
      ) VALUES (
        '${actionType}', '${entityType}', ${entityId}, ${entityName},
        ${userId}, ${userName}, ${description},
        ${oldValues}, ${newValues}, ${ipAddress}, datetime('now')
      )
    `

        console.log('[Audit Log] SQL:', sql)
        db.run(sql)

        persistDatabase()
        console.log('[Audit Log] Successfully logged action')
    } catch (error) {
        console.error('[Audit Log] Error logging audit entry:', error)
    }
}

/**
 * Log a CREATE action
 */
export function logCreate(entityType: string, entityId: number, entityName: string, data?: any): void {
    logAudit({
        action_type: 'CREATE',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: `تم إضافة ${getEntityTypeArabic(entityType)}: ${entityName}`,
        new_values: data
    })
}

/**
 * Log an UPDATE action
 */
export function logUpdate(entityType: string, entityId: number, entityName: string, oldData?: any, newData?: any): void {
    logAudit({
        action_type: 'UPDATE',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: `تم تعديل ${getEntityTypeArabic(entityType)}: ${entityName}`,
        old_values: oldData,
        new_values: newData
    })
}

/**
 * Log a DELETE action
 */
export function logDelete(entityType: string, entityId: number, entityName: string): void {
    logAudit({
        action_type: 'DELETE',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: `تم حذف ${getEntityTypeArabic(entityType)}: ${entityName}`
    })
}

/**
 * Log an APPROVE action
 */
export function logApprove(entityType: string, entityId: number, entityName: string): void {
    logAudit({
        action_type: 'APPROVE',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: `تم اعتماد ${getEntityTypeArabic(entityType)}: ${entityName}`
    })
}

/**
 * Log a REJECT action
 */
export function logReject(entityType: string, entityId: number, entityName: string): void {
    logAudit({
        action_type: 'REJECT',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: `تم رفض ${getEntityTypeArabic(entityType)}: ${entityName}`
    })
}

/**
 * Get recent audit log entries
 */
export function getRecentAuditLogs(limit: number = 20): any[] {
    try {
        console.log('[Audit Log] Fetching recent audit logs, limit:', limit)
        const db = getDatabase()
        const result = db.exec(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ${limit}
    `)

        console.log('[Audit Log] Query result:', result)

        if (result.length === 0) {
            console.log('[Audit Log] No results found')
            return []
        }

        const columns = result[0].columns
        const values = result[0].values

        const logs = values.map(row => {
            const obj: any = {}
            columns.forEach((col, idx) => {
                obj[col] = row[idx]
            })
            return obj
        })

        console.log('[Audit Log] Returning', logs.length, 'audit log entries')
        return logs
    } catch (error) {
        console.error('[Audit Log] Error fetching audit logs:', error)
        return []
    }
}

/**
 * Get Arabic name for entity type
 */
function getEntityTypeArabic(entityType: string): string {
    const types: Record<string, string> = {
        'employee': 'موظف',
        'course': 'دورة تدريبية',
        'payroll': 'راتب',
        'leave': 'إجازة',
        'evaluation': 'تقييم',
        'promotion': 'ترقية',
        'reward': 'مكافأة',
        'absence': 'غياب',
        'attachment': 'مرفق',
        'exchange_rate': 'سعر صرف',
        'operational_plan': 'خطة تشغيلية',
        'kpi': 'مؤشر أداء',
        'delay': 'تأخير'
    }

    return types[entityType] || entityType
}
