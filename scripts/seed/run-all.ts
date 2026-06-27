import { seedCategories } from './seed-categories'
import { seedCreatures } from './seed-creatures'
import { seedStories } from './seed-stories'

async function main() {
  console.log('Starting data seeding...\n')

  await seedCategories()
  await seedCreatures()
  await seedStories()

  console.log('\n✅ All data seeded successfully!')
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
