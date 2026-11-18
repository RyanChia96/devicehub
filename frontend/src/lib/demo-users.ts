/** Mock staff accounts for the Users page until the backend exists. */
import type { BranchId } from "./branches";
import type { Role } from "./roles";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  branches: Exclude<BranchId, "">[];
  status: "Active" | "Invited" | "Deactivated";
  lastSeen: string;
}

export const DEMO_USERS: StaffUser[] = [
  { id: "us1", name: "Ong Kah Hoe", email: "kahhoe.ong@serigajet.com.my", phone: "012-200 1188", role: "Owner", branches: ["KLSW", "PJ", "JB"], status: "Active", lastSeen: "18/11/2026 09:12" },
  { id: "us2", name: "Farid Iskandar", email: "farid.iskandar@serigajet.com.my", phone: "019-334 2210", role: "Branch Manager", branches: ["KLSW", "PJ"], status: "Active", lastSeen: "18/11/2026 08:58" },
  { id: "us3", name: "Rajesh Kumar", email: "rajesh.kumar@serigajet.com.my", phone: "016-771 0902", role: "Branch Manager", branches: ["JB"], status: "Active", lastSeen: "17/11/2026 18:40" },
  { id: "us4", name: "Aisyah Rahman", email: "aisyah.rahman@serigajet.com.my", phone: "011-2345 6711", role: "Cashier", branches: ["KLSW"], status: "Active", lastSeen: "18/11/2026 10:21" },
  { id: "us5", name: "Daniel Lim", email: "daniel.lim@serigajet.com.my", phone: "012-889 0321", role: "Cashier", branches: ["KLSW"], status: "Active", lastSeen: "17/11/2026 21:04" },
  { id: "us6", name: "Kevin Tan", email: "kevin.tan@serigajet.com.my", phone: "017-602 4410", role: "Cashier", branches: ["PJ"], status: "Active", lastSeen: "18/11/2026 10:02" },
  { id: "us7", name: "Siti Hajar", email: "siti.hajar@serigajet.com.my", phone: "013-990 1287", role: "Cashier", branches: ["JB"], status: "Active", lastSeen: "18/11/2026 09:47" },
  { id: "us8", name: "Lim Wei Jie", email: "weijie.lim@serigajet.com.my", phone: "012-455 3009", role: "Stock Clerk", branches: ["KLSW", "PJ"], status: "Active", lastSeen: "18/11/2026 08:30" },
  { id: "us9", name: "Nurul Ain", email: "nurul.ain@serigajet.com.my", phone: "014-332 7801", role: "Stock Clerk", branches: ["PJ"], status: "Active", lastSeen: "16/11/2026 18:30" },
  { id: "us10", name: "Kumar Selvam", email: "kumar.selvam@serigajet.com.my", phone: "016-208 5544", role: "Technician", branches: ["KLSW"], status: "Active", lastSeen: "18/11/2026 09:05" },
  { id: "us11", name: "Tan Jia Wen", email: "jiawen.tan@serigajet.com.my", phone: "018-776 2310", role: "Cashier", branches: ["KLSW"], status: "Invited", lastSeen: "Invite sent 17/11/2026" },
  { id: "us12", name: "Mohd Azlan bin Yusof", email: "azlan.yusof@serigajet.com.my", phone: "019-551 0087", role: "Technician", branches: ["JB"], status: "Deactivated", lastSeen: "30/09/2026 17:15" },
];
