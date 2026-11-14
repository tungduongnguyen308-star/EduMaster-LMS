import "dotenv/config";
import prisma from "../src/config/prisma";
import { Role } from "@prisma/client";
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const role = process.argv[3] as Role;
  if (!email || !Object.values(Role).includes(role)) {
    console.error('Usage: npm run promote -- "you@example.com" ADMIN|INSTRUCTOR|STUDENT');
    process.exitCode = 1;
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!existing) { console.error("Account not found: register first, then promote"); process.exitCode = 1; return; }
  const user = await prisma.user.update({ where: { email }, data: { role }, select: { id: true, email: true, role: true } });
  console.log(user);
}
main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
