const fs = require('fs/promises')
const path = require('path')

const uploadsRoot = path.resolve(__dirname, '../../uploads')

const resolveStoredPath = (storedPath) => {
  if (typeof storedPath !== 'string') {
    return null
  }

  const trimmedPath = storedPath.trim()
  if (!trimmedPath) {
    return null
  }

  const absolutePath = path.isAbsolute(trimmedPath) ? path.normalize(trimmedPath) : path.resolve(uploadsRoot, trimmedPath)
  const relativePath = path.relative(uploadsRoot, absolutePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null
  }

  return absolutePath
}

const deleteStoredFiles = async (storedPaths = []) => {
  const uniquePaths = [...new Set(storedPaths.map(resolveStoredPath).filter(Boolean))]

  const results = await Promise.allSettled(
    uniquePaths.map(async (filePath) => {
      await fs.unlink(filePath)
    })
  )

  const failures = results
    .map((result, index) => ({ result, filePath: uniquePaths[index] }))
    .filter(({ result }) => result.status === 'rejected' && result.reason?.code !== 'ENOENT')

  if (failures.length > 0) {
    console.error(
      'Failed to delete uploaded files:',
      failures.map(({ filePath, result }) => ({
        filePath,
        message: result.reason?.message || String(result.reason)
      }))
    )
  }
}

module.exports = {
  deleteStoredFiles
}
