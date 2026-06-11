import Papa from 'papaparse'
import { toIsoDate } from './dates'
import { createId } from './id'

const FIELD_ALIASES = {
  firstName: ['firstname', 'first', 'givenname', 'שםפרטי'],
  lastName: ['lastname', 'last', 'surname', 'שםמשפחה'],
  fullName: ['name', 'fullname', 'volunteername', 'volunteer', 'שם', 'שםמלא'],
  email: ['email', 'mail', 'דואל', 'אימייל'],
  phone: ['phone', 'mobile', 'cell', 'טלפון', 'נייד'],
  departmentName: ['department', 'dept', 'team', 'מחלקה', 'צוות'],
  skills: ['skills', 'skill', 'expertise', 'כישורים', 'מיומנויות'],
  city: ['city', 'location', 'עיר', 'יישוב'],
  joinedAt: ['joined', 'joinedat', 'joindate', 'startdate', 'תאריךהצטרפות'],
  roleName: ['role', 'rolename', 'eventrole', 'position', 'task', 'תפקיד', 'משימה'],
}

const HEADERLESS_FIELDS = [
  'fullName',
  'email',
  'phone',
  'departmentName',
  'skills',
  'city',
  'roleName',
  'joinedAt',
]

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_.-]+/g, '')
}

function getAllAliases() {
  return new Set(
    Object.values(FIELD_ALIASES)
      .flat()
      .map((alias) => normalizeKey(alias)),
  )
}

function rowLooksLikeHeader(row) {
  const aliases = getAllAliases()
  const normalizedCells = row.map((cell) => normalizeKey(cell)).filter(Boolean)
  return normalizedCells.some((cell) => aliases.has(cell))
}

function buildHeaderIndex(headerRow) {
  const normalizedHeader = headerRow.map((cell) => normalizeKey(cell))

  return Object.entries(FIELD_ALIASES).reduce((index, [field, aliases]) => {
    const normalizedAliases = aliases.map((alias) => normalizeKey(alias))
    const columnIndex = normalizedHeader.findIndex((header) =>
      normalizedAliases.includes(header),
    )

    if (columnIndex >= 0) index[field] = columnIndex
    return index
  }, {})
}

function readCell(row, field, headerIndex) {
  const columnIndex = headerIndex
    ? headerIndex[field]
    : HEADERLESS_FIELDS.indexOf(field)

  if (columnIndex === undefined || columnIndex < 0) return ''
  return String(row[columnIndex] ?? '').trim()
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts.shift() ?? '',
    lastName: parts.join(' '),
  }
}

function parseSkills(value) {
  if (!value) return []
  return value
    .split(/[;,|]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

function normalizeDate(value) {
  if (!value) return toIsoDate(new Date())
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? toIsoDate(new Date()) : toIsoDate(date)
}

function normalizeVolunteer(row, index, headerIndex) {
  const fullName = readCell(row, 'fullName', headerIndex)
  const nameParts = fullName ? splitName(fullName) : { firstName: '', lastName: '' }
  const email = readCell(row, 'email', headerIndex)
  const firstName =
    readCell(row, 'firstName', headerIndex) ||
    nameParts.firstName ||
    email ||
    `Volunteer ${index + 1}`
  const lastName = readCell(row, 'lastName', headerIndex) || nameParts.lastName

  return {
    id: createId('vol'),
    firstName,
    lastName,
    email,
    phone: readCell(row, 'phone', headerIndex),
    city: readCell(row, 'city', headerIndex),
    skills: parseSkills(readCell(row, 'skills', headerIndex)),
    departmentName: readCell(row, 'departmentName', headerIndex),
    roleName: readCell(row, 'roleName', headerIndex),
    joinedAt: normalizeDate(readCell(row, 'joinedAt', headerIndex)),
  }
}

function normalizeRows(rows) {
  const cleanRows = rows.filter((row) =>
    row.some((cell) => String(cell ?? '').trim().length > 0),
  )

  if (!cleanRows.length) return []

  const hasHeader = rowLooksLikeHeader(cleanRows[0])
  const headerIndex = hasHeader ? buildHeaderIndex(cleanRows[0]) : null
  const dataRows = hasHeader ? cleanRows.slice(1) : cleanRows

  return dataRows.map((row, index) => normalizeVolunteer(row, index, headerIndex))
}

export function parseVolunteerCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          reject(result.errors[0])
          return
        }

        resolve(normalizeRows(result.data))
      },
      error: reject,
    })
  })
}
