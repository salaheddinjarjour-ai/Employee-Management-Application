import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import { logCreate, logUpdate, logDelete } from '../../utils/auditLog'

export const coursesHandlers = {
    list: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            // Join courses, enrollments, and employees
            // Return mapped columns: course_name (title), provider (instructor), etc.
            const result = db.exec(`
                SELECT 
                    c.id, 
                    c.title as course_name, 
                    c.instructor as provider,
                    c.trainer_name,
                    c.training_org,
                    c.start_date,
                    c.end_date,
                    c.status,
                    c.attachment_path,
                    e.full_name as employee_name,
                    ce.employee_id,
                    ce.grade,
                    ce.result,
                    ce.score
                FROM courses c
                LEFT JOIN course_enrollments ce ON c.id = ce.course_id
                LEFT JOIN employees e ON ce.employee_id = e.id
                ORDER BY c.created_at DESC
            `)

            if (result.length > 0 && result[0].values) {
                const columns = result[0].columns
                return result[0].values.map(row => {
                    const obj: any = {}
                    columns.forEach((col, i) => {
                        obj[col] = row[i]
                    })
                    return obj
                })
            }
            return []
        } catch (error) {
            console.error('Error listing courses:', error)
            return []
        }
    },

    create: async (data: any) => {
        const db = getDatabase()
        try {
            console.log('[Courses Create] Received data:', JSON.stringify(data, null, 2))

            db.exec('BEGIN TRANSACTION')

            const courseName = data.course_name ? `'${data.course_name.replace(/'/g, "''")}'` : "'Untitled Course'"
            const provider = data.provider ? `'${data.provider.replace(/'/g, "''")}'` : "''"
            const trainerNameCreate = data.trainer_name ? `'${data.trainer_name.replace(/'/g, "''")}'` : 'NULL'
            const trainingOrgCreate = data.training_org ? `'${data.training_org.replace(/'/g, "''")}'` : 'NULL'
            const startDate = data.start_date ? `'${data.start_date}'` : 'NULL'
            const endDate = data.end_date ? `'${data.end_date}'` : 'NULL'
            const status = data.status ? `'${data.status}'` : "'مخطط'"

            console.log('[Courses Create] Prepared values:', { courseName, provider, startDate, endDate, status })

            // 1. Insert Course with default values for undefined fields
            db.run(`
                INSERT INTO courses (title, instructor, trainer_name, training_org, start_date, end_date, status, created_at)
                VALUES (${courseName}, ${provider}, ${trainerNameCreate}, ${trainingOrgCreate}, ${startDate}, ${endDate}, ${status}, datetime('now'))
            `)

            const courseRes = db.exec('SELECT last_insert_rowid() as id')
            const courseId = courseRes[0].values[0][0]

            console.log('[Courses Create] Created course with ID:', courseId)

            // 2. Insert Enrollment if employee selected
            if (data.employee_id) {
                const enrollmentStatus = data.status ? `'${data.status}'` : "'مخطط'"
                const grade = data.grade ? `'${data.grade}'` : 'NULL'
                const result = data.result ? `'${data.result.replace(/'/g, "''")}'` : 'NULL'

                console.log('[Courses Create] Creating enrollment:', { employee_id: data.employee_id, grade, result })

                db.run(`
                    INSERT INTO course_enrollments (
                        course_id, employee_id, enrollment_date, 
                        completion_status, grade, result
                    ) VALUES (${courseId}, ${data.employee_id}, datetime('now'), ${enrollmentStatus}, ${grade}, ${result})
                `)
            }

            db.exec('COMMIT')
            persistDatabase()

            // Log audit
            logCreate('course', courseId as number, data.course_name || 'دورة جديدة', data)

            console.log('[Courses Create] Success!')
            return { success: true, id: courseId }
        } catch (error) {
            db.exec('ROLLBACK')
            console.error('Error creating course:', error)
            throw error
        }
    },

    update: async (event: IpcMainInvokeEvent, id: number, data: any) => {
        const db = getDatabase()
        try {
            const courseName = data.course_name ? `'${data.course_name.replace(/'/g, "''")}'` : 'NULL'
            const provider = data.provider ? `'${data.provider.replace(/'/g, "''")}'` : 'NULL'
            const trainerName = data.trainer_name ? `'${data.trainer_name.replace(/'/g, "''")}'` : 'NULL'
            const trainingOrg = data.training_org ? `'${data.training_org.replace(/'/g, "''")}'` : 'NULL'
            const startDate = data.start_date ? `'${data.start_date}'` : 'NULL'
            const endDate = data.end_date ? `'${data.end_date}'` : 'NULL'
            const status = data.status ? `'${data.status}'` : 'NULL'

            db.run(`
                UPDATE courses SET 
                    title = ${courseName}, instructor = ${provider}, trainer_name = ${trainerName}, training_org = ${trainingOrg}, start_date = ${startDate}, end_date = ${endDate}, status = ${status}, updated_at = datetime('now')
                WHERE id = ${id}
            `)

            // Update enrollment if present
            if (data.employee_id || data.grade !== undefined || data.result !== undefined) {
                const gradeVal = (data.grade !== undefined && data.grade !== '' && data.grade !== null) ? Number(data.grade) : null
                const gradeStr = gradeVal !== null ? String(gradeVal) : 'NULL'
                const resultStr = data.result ? `'${String(data.result).replace(/'/g, "''")}'` : 'NULL'

                if (data.employee_id) {
                    // Check if enrollment exists
                    const existingEnroll = db.exec(`SELECT id FROM course_enrollments WHERE course_id = ${id} AND employee_id = ${data.employee_id}`)
                    if (existingEnroll.length > 0 && existingEnroll[0].values.length > 0) {
                        db.run(`
                            UPDATE course_enrollments SET
                                grade = ${gradeStr},
                                result = ${resultStr}
                            WHERE course_id = ${id} AND employee_id = ${data.employee_id}
                        `)
                    } else {
                        db.run(`
                            INSERT OR REPLACE INTO course_enrollments (course_id, employee_id, grade, result, enrollment_date)
                            VALUES (${id}, ${data.employee_id}, ${gradeStr}, ${resultStr}, datetime('now'))
                        `)
                    }
                } else {
                    // Update any existing enrollment for this course
                    db.run(`
                        UPDATE course_enrollments SET
                            grade = ${gradeStr},
                            result = ${resultStr}
                        WHERE course_id = ${id}
                    `)
                }
            }

            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error updating course:', error)
            throw error
        }
    },

    delete: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            // Get course name for audit
            const courseResult = db.exec(`SELECT title FROM courses WHERE id = ${id}`)
            const courseName = courseResult.length > 0 && courseResult[0].values.length > 0
                ? courseResult[0].values[0][0] as string
                : 'دورة'

            db.run(`DELETE FROM courses WHERE id = ${id}`)
            // Cascade delete handles enrollments
            persistDatabase()

            // Log audit
            logDelete('course', id, courseName)

            return { success: true }
        } catch (error) {
            console.error('Error deleting course:', error)
            throw error
        }
    }
}
