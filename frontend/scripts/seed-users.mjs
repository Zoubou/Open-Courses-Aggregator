import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

const mongoUri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'open_courses_aggregator'

if (!mongoUri) {
  console.error('Missing MONGODB_URI. Example:')
  console.error('  MONGODB_URI="mongodb://localhost:27017" npm run seed:users')
  process.exit(1)
}

const adminUsername = process.env.ADMIN_USERNAME || 'admin'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin'

const client = new MongoClient(mongoUri)

try {
  await client.connect()
  const db = client.db(dbName)
  const users = db.collection('users')

  await users.createIndex({ username: 1 }, { unique: true })

  const passwordHash = await bcrypt.hash(adminPassword, 10)
  const now = new Date()

  const result = await users.updateOne(
    { username: adminUsername },
    {
      $set: {
        passwordHash,
        updatedAt: now,
      },
      $setOnInsert: {
        username: adminUsername,
        role: 'admin',
        createdAt: now,
      },
    },
    { upsert: true },
  )

  if (result.upsertedCount === 1) {
    console.log(`Created user: ${adminUsername} in db: ${dbName}`)
  } else {
    console.log(`Updated user: ${adminUsername} in db: ${dbName}`)
  }

  console.log('Collection ensured: users')
} finally {
  await client.close()
}
