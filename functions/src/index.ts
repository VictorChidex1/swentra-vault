import * as admin from "firebase-admin";

admin.initializeApp();

// Entry point for Swentra Vault Cloud Functions. Each domain module below
// exports Cloud Functions only; shared helpers live in ./config and ./emails
// and are intentionally NOT re-exported here (the Firebase CLI would try to
// deploy any named export of this file).
export * from "./authEmails";
export { provisionAccounts } from "./provision";
export * from "./quotes";
export * from "./transfers";
export * from "./wires";
export * from "./adminUsers";
export * from "./adminKyc";
export * from "./adminSystem";
export * from "./adminFinance";
export * from "./pin";