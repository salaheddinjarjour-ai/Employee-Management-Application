import employees from './employeesRepo'
import courses from './coursesRepo'
import evaluations from './evaluationsRepo'
import promotions from './promotionsRepo'
import rewards from './rewardsRepo'
import leaves from './leavesRepo'
import absences from './absencesRepo'
import payroll from './payrollRepo'
import departments from './departmentsRepo'
import units from './unitsRepo'
import committees from './committeesRepo'
import sections from './sectionsRepo'
import locations from './locationsRepo'
import holidays from './holidaysRepo'
import loans from './loansRepo'
import overtime from './overtimeRepo'
import penalties from './penaltiesRepo'
import users from './usersRepo'
import { AttachmentRepository } from './AttachmentRepository'
import employeeAttachments from './employeeAttachmentsRepo'
import { ExchangeRateRepository } from './ExchangeRateRepository'
import serviceYears from './serviceYearsRepo'

const attachments = new AttachmentRepository()
const exchangeRates = new ExchangeRateRepository()

export default {
  employees,
  courses,
  evaluations,
  promotions,
  rewards,
  leaves,
  absences,
  payroll,
  departments,
  units,
  committees,
  sections,
  locations,
  holidays,
  loans,
  overtime,
  penalties,
  users,
  attachments,
  employeeAttachments,
  exchangeRates,
  serviceYears
}
