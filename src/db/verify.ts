import { db } from "./index";
import { companies, employees, user } from "./schema";

async function verify() {
  const allCompanies = await db.select().from(companies);
  console.log("Companies:", allCompanies.map(c => c.name));

  const allEmployees = await db.select().from(employees);
  console.log("Employees Count:", allEmployees.length);

  const allUsers = await db.select().from(user);
  console.log("Users:", allUsers.map(u => u.email));
}

verify().catch(console.error);
