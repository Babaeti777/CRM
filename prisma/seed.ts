import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create divisions
  const divisions = await Promise.all([
    prisma.division.upsert({
      where: { name: 'General Construction' },
      update: {},
      create: {
        name: 'General Construction',
        description: 'General construction and building services',
      },
    }),
    prisma.division.upsert({
      where: { name: 'Electrical' },
      update: {},
      create: {
        name: 'Electrical',
        description: 'Electrical contractors and services',
      },
    }),
    prisma.division.upsert({
      where: { name: 'Plumbing' },
      update: {},
      create: {
        name: 'Plumbing',
        description: 'Plumbing and HVAC services',
      },
    }),
    prisma.division.upsert({
      where: { name: 'Concrete & Masonry' },
      update: {},
      create: {
        name: 'Concrete & Masonry',
        description: 'Concrete work and masonry services',
      },
    }),
    prisma.division.upsert({
      where: { name: 'Roofing' },
      update: {},
      create: {
        name: 'Roofing',
        description: 'Roofing and waterproofing services',
      },
    }),
    prisma.division.upsert({
      where: { name: 'Landscaping' },
      update: {},
      create: {
        name: 'Landscaping',
        description: 'Landscaping and site work',
      },
    }),
  ])

  console.log(`Created ${divisions.length} divisions`)

  // Create sample subcontractors
  const subcontractors = await Promise.all([
    prisma.subcontractor.upsert({
      where: { email: 'john@electricpro.com' },
      update: {},
      create: {
        name: 'John Smith',
        email: 'john@electricpro.com',
        phone: '555-0101',
        company: 'Electric Pro Services',
        address: '123 Main St, City, State 12345',
        divisions: {
          create: [
            { divisionId: divisions.find((d) => d.name === 'Electrical')!.id },
          ],
        },
      },
    }),
    prisma.subcontractor.upsert({
      where: { email: 'sarah@plumbingexperts.com' },
      update: {},
      create: {
        name: 'Sarah Johnson',
        email: 'sarah@plumbingexperts.com',
        phone: '555-0102',
        company: 'Plumbing Experts Inc',
        address: '456 Oak Ave, City, State 12345',
        divisions: {
          create: [
            { divisionId: divisions.find((d) => d.name === 'Plumbing')!.id },
          ],
        },
      },
    }),
    prisma.subcontractor.upsert({
      where: { email: 'mike@concreteworks.com' },
      update: {},
      create: {
        name: 'Mike Williams',
        email: 'mike@concreteworks.com',
        phone: '555-0103',
        company: 'Concrete Works LLC',
        address: '789 Pine Rd, City, State 12345',
        divisions: {
          create: [
            { divisionId: divisions.find((d) => d.name === 'Concrete & Masonry')!.id },
          ],
        },
      },
    }),
    prisma.subcontractor.upsert({
      where: { email: 'lisa@roofingpros.com' },
      update: {},
      create: {
        name: 'Lisa Brown',
        email: 'lisa@roofingpros.com',
        phone: '555-0104',
        company: 'Roofing Pros',
        address: '321 Elm St, City, State 12345',
        divisions: {
          create: [
            { divisionId: divisions.find((d) => d.name === 'Roofing')!.id },
          ],
        },
      },
    }),
    prisma.subcontractor.upsert({
      where: { email: 'david@greenlandscaping.com' },
      update: {},
      create: {
        name: 'David Garcia',
        email: 'david@greenlandscaping.com',
        phone: '555-0105',
        company: 'Green Landscaping',
        address: '654 Maple Dr, City, State 12345',
        divisions: {
          create: [
            { divisionId: divisions.find((d) => d.name === 'Landscaping')!.id },
          ],
        },
      },
    }),
  ])

  console.log(`Created ${subcontractors.length} subcontractors`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
