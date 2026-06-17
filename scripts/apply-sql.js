// 經 transaction pooler (6543) 直接執行 SQL 檔。
// 因本網絡封鎖 port 5432，prisma migrate/db push 無法使用，改用此腳本套用 schema 變更。
// 用法: node --env-file=.env scripts/apply-sql.js <sql-file>
const fs = require("fs");
const { Client } = require("pg");

const file = process.argv[2];
if (!file) {
  console.error("用法: node scripts/apply-sql.js <sql-file>");
  process.exit(1);
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("請先設定 DIRECT_URL 或 DATABASE_URL");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const client = new Client({
  connectionString: url.replace("?pgbouncer=true", ""),
  ssl: { rejectUnauthorized: false },
});

client
  .connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log(`已套用 ${file}`);
    return client.end();
  })
  .catch((e) => {
    console.error("執行失敗:", e.message);
    process.exit(1);
  });
